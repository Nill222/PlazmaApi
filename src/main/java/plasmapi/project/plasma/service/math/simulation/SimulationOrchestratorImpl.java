package plasmapi.project.plasma.service.math.simulation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto; // <- если есть у вас
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionRequest;
import plasmapi.project.plasma.dto.mathDto.lattice.LatticeGenerationRequest;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaRequestDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaParameters;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.dto.mathDto.slr.SLRResult;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalDto;
import plasmapi.project.plasma.dto.mathDto.trajectory.TrajectoryDto;
import plasmapi.project.plasma.model.atom.Atom;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.atom.StructureType;
import plasmapi.project.plasma.model.res.Config;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.dto.mathDto.trajectory.Point3d;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.repository.*;
import plasmapi.project.plasma.service.math.collision.CollisionService;
import plasmapi.project.plasma.service.math.diffusion.DiffusionService;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;
import plasmapi.project.plasma.service.math.potential.PotentialService;
import plasmapi.project.plasma.service.math.resonanse.ResonanceService;
import plasmapi.project.plasma.service.math.slr.SLRService;
import plasmapi.project.plasma.service.math.thermal.ThermalService;
import plasmapi.project.plasma.service.math.trajectoryIntegrator.TrajectoryIntegratorService;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SimulationOrchestratorImpl implements SimulationOrchestratorService {

    private final ConfigRepository configRepo;
    private final IonRepository ionRepo;
    private final AtomRepository atomRepo;
    private final ResultRepository resultRepo;

    private final PlasmaService plasmaService;
    private final TrajectoryIntegratorService trajIntegrator;
    private final ResonanceService resonanceService;
    private final CollisionService collisionService;
    private final ThermalService thermalService;
    private final DiffusionService diffusionService;
    private final SLRService slrService;
    private final PotentialService potentialService;

    private static final double KB = 1.380649e-23;
    private static final double R = 8.314462618;

    @Transactional
    @Override
    public SimulationResultDto run(SimulationRequestDto req) {
        // 1) загрузка сущностей
        Config cfg = configRepo.findById(req.configId())
                .orElseThrow(() -> new IllegalArgumentException("Config not found: " + req.configId()));
        Ion ion = ionRepo.findById(req.ionId())
                .orElseThrow(() -> new IllegalArgumentException("Ion not found: " + req.ionId()));

        // 2) опциональная генерация решетки (если пользователь попросил)
        if (req.generateLattice() && req.latticeRequest() != null) {
            // предполагаем, что у вас есть LatticeService с методом generateLattice(LatticeGenerationRequest)
            // latticeService.generateLattice(req.latticeRequest());
            log.info("generateLattice requested ({} atoms), skipping explicit call - implement if needed", req.latticeRequest().count());
        }

        // 3) загрузка атомов, ассоциированных с config
        List<Atom> atoms = atomRepo.findByConfigId(cfg.getId());
        if (atoms.isEmpty()) throw new IllegalStateException("No atoms in config " + cfg.getId());

        // representative atom (первый в списке)
        Atom atom0 = atoms.get(0);
        AtomList atType = atom0.getAtomList();

        // 4) расчёт траектории и энергии иона
        // используем простую схему: старт в (0,0,0) — прицеливаемся в координаты первого атома
        Point3d anode = new Point3d(0.0, 0.0, 0.0);
        Point3d target = new Point3d(
                Optional.ofNullable(atom0.getX()).orElse(0.0),
                Optional.ofNullable(atom0.getY()).orElse(0.0),
                Optional.ofNullable(atom0.getZ()).orElse(0.0)
        );

        // TrajectoryIntegratorService интегрирует поле; у вас реализация возвращает TrajectoryDto
        TrajectoryDto traj = trajIntegrator.integrate(
                anode,
                target,
                req.plasmaVoltage(),
                req.pressure(),
                new double[]{0.0, 0.0, 0.0},                   // B-field — по умолчанию ноль
                ion.getMass(),
                ion.getCharge() * 1.602176634e-19
        );

        double ionEnergy = traj.integralWork(); // работа q ∫E·dl → энергия кинетическая (J)

        // 5) параметры плазмы (берём конфигурацию по configId)
        PlasmaParameters plasmaParams = plasmaService.calculate(new PlasmaRequestDto(req.configId()));

        // 6) резонансный множитель xi
        // в record ResonanceInputDto у вас поля optional — передаём null если не задано
        double xi = resonanceService.computeXi(null, atType); // если есть входные данные резонанса — передать их

        // 7) цикл столкновений (sample subset для скорости) — используем record CollisionDto если он есть
        int sampleN = Math.min(atoms.size(), 1000);
        List<Double> perAtomTransferred = new ArrayList<>(sampleN);
        double totalTransferred = 0.0;

        for (int i = 0; i < sampleN; i++) {
            Atom a = atoms.get(i);
            AtomList at = a.getAtomList();

            CollisionDto collisionDto = new CollisionDto(
                    null,                                   // distance — нет явного расстояния → пусть сервис сам возьмёт nn
                    at.getA() * 1e-10,                      // latticeParameter в метрах
                    req.impactAngle(),                      // угол°
                    ionEnergy,                              // энергия иона (J)
                    ion.getMass(),                          // масса иона
                    at.getMass(),                           // масса атома мишени
                    xi,                                     // резонансный множитель ξ
                    cfg.getConfig().getSurfaceBindingEnergy(), // энергия связи поверхности
                    at.getStructure(),                      // структура
                    at                                      // сам атом (для PotentialService)
            );

            CollisionResult cres = collisionService.simulate(collisionDto);
            perAtomTransferred.add(cres.transferredEnergy());
            totalTransferred += cres.transferredEnergy();
        }

        double avgTransferred = totalTransferred / Math.max(1, perAtomTransferred.size());
        double estimatedTemp = avgTransferred / KB;

        // 8) Thermal simulation — формируем ThermalDto (record)
        ThermalDto thermalDto = new ThermalDto(
                /* T0 */ estimatedTemp,                 // начальная температура можем взять оценку
                /* tMax */ req.totalTime(),
                /* dt */ req.timeStep(),
                /* density */ atType.getMass() != null ? atType.getMass() * 6.02214076e23 : null, // если mass задан в кг/атом — преобразовать; иначе null
                /* thickness */ 1e-6,
                /* area */ 1e-4,
                /* lambda0 */ req.thermalConductivity(),
                /* debyeTemperature */ atType.getDebyeTemperature(),
                /* molarMass */ null, // можно взять из AtomList если хранится
                /* structure */ atType.getStructure(),
                /* potential */ null,
                /* atom */ atType,
                /* ionEnergy */ totalTransferred,
                /* exposureTime */ req.totalTime(),
                /* powerInput */ null,
                /* energyDensityPerSec */ null,
                /* envTemp */ 300.0
        );

        List<Double> cooling = thermalService.simulateCooling(thermalDto);
        double finalTemp = cooling.isEmpty() ? estimatedTemp : cooling.get(cooling.size() - 1);

        // 9) Diffusion: составляем DiffusionRequest (order: depth, dx, dt, tMax, D, c0, structure, potential, damageEnergy, damageRate, activationEnergy, temperature, temperatureProfile)
        double D0 = req.diffusionPrefactor();
        double Q = req.activationEnergy(); // J/mol as per your record comment
        double D_eff = D0 * Math.exp(-Q / (R * Math.max(1.0, finalTemp)));

        DiffusionRequest diffReq = new DiffusionRequest(
                /* depth */ req.depth(),
                /* dx */ 1e-9,
                /* dt */ req.timeStep(),
                /* tMax */ req.totalTime(),
                /* D */ D_eff,
                /* c0 */ req.surfaceConcentration(),
                /* structure */ req.latticeStructure(),
                /* potential */ null,
                /* damageEnergy */ totalTransferred,
                /* damageRate */ (totalTransferred / Math.max(1.0, req.totalTime())),
                /* activationEnergy */ req.activationEnergy(),
                /* temperature */ finalTemp,
                /* temperatureProfile */ null
        );

        DiffusionProfileDto diffusionProfile = diffusionService.calculateDiffusionProfile(diffReq);

        // 10) SLR: строим поле толщин — здесь используем простую генерацию на основе avgTransferred (как у вас было)
        int nx = 32, ny = 32;
        double[][] thicknessField = buildSimpleThicknessFromAtoms(atoms, nx, ny, avgTransferred);
        SLRResult slrResult = slrService.computeSLR(thicknessField,  req.diffusionPrefactor() /* или другой параметр SLR */ );

        // 11) собираем результат
        SimulationResultDto resultDto = new SimulationResultDto(
                ion.getName(),
                atType.getAtomName(),
                totalTransferred,
                avgTransferred,
                estimatedTemp,
                D_eff,
                plasmaParams,
                perAtomTransferred,
                diffusionProfile,
                cooling
        );

        // 12) сохраняем краткий итог в БД
        Result rEntity = new Result();
        rEntity.setConfig(cfg);
        rEntity.setIon(ion);
        rEntity.setEnergy(totalTransferred);
        rEntity.setPotential(req.plasmaVoltage());
        rEntity.setTemperature(finalTemp);
        resultRepo.save(rEntity);

        return resultDto;
    }

    private double[][] buildSimpleThicknessFromAtoms(List<Atom> atoms, int nx, int ny, double scale) {
        if (nx <= 0) nx = 10;
        if (ny <= 0) ny = 10;
        double[][] f = new double[nx][ny];
        for (int i = 0; i < nx; i++) {
            for (int j = 0; j < ny; j++) {
                double val = scale * (1.0 + 0.1 * Math.sin(i * 0.3) * Math.cos(j * 0.2));
                f[i][j] = val;
            }
        }
        return f;
    }
}
