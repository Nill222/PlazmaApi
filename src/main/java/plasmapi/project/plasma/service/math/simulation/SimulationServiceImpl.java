package plasmapi.project.plasma.service.math.simulation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionRequest;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaParameters;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalDto;
import plasmapi.project.plasma.model.atom.Atom;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Config;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.repository.*;
import plasmapi.project.plasma.service.math.lattice.LatticeService;
import plasmapi.project.plasma.service.math.collision.CollisionService;
import plasmapi.project.plasma.service.math.diffusion.DiffusionService;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;
import plasmapi.project.plasma.service.math.potential.PotentialService;
import plasmapi.project.plasma.service.math.thermal.ThermalService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SimulationServiceImpl implements SimulationService {

    private static final double kB = 1.380649e-23;
    private static final double eCharge = 1.602176634e-19;
    private static final double R = 8.314462618;
    private static final double STABILITY_LIMIT = 0.5;
    private static final double MIN_DT = 1e-12;  // минимальный шаг времени
    private static final double MIN_DX = 1e-10;  // минимальный шаг по глубине

    private final AtomRepository atomRepository;
    private final AtomListRepository atomListRepository;
    private final IonRepository ionRepository;
    private final ConfigRepository configRepository;
    private final ResultRepository resultRepository;

    private final LatticeService latticeService;
    private final CollisionService collisionService;
    private final DiffusionService diffusionService;
    private final PlasmaService plasmaService;
    private final ThermalService thermalService;
    private final PotentialService potentialService;

    @Transactional
    @Override
    public SimulationResultDto runSimulation(SimulationRequestDto req) {

        // 1️⃣ Загрузка конфигурации и иона
        Config config = configRepository.findById(req.configId())
                .orElseThrow(() -> new IllegalArgumentException("Config not found: " + req.configId()));
        Ion ion = ionRepository.findById(req.ionId())
                .orElseThrow(() -> new IllegalArgumentException("Ion not found: " + req.ionId()));

        // 2️⃣ Генерация решётки
        if (req.generateLattice()) {
            latticeService.generateLattice(req.latticeRequest());
        }
        List<Atom> atoms = atomRepository.findByConfigId(config.getId());
        if (atoms.isEmpty()) {
            throw new IllegalStateException("No atoms in config " + config.getId());
        }

        // 3️⃣ Плазма
        PlasmaParameters plasmaParams = plasmaService.calculate(
                new PlasmaDto(req.plasmaVoltage(), req.pressure(), req.electronTemp())
        );
        if (plasmaParams == null) plasmaParams = new PlasmaParameters(0,0,0,0,0,0);

        // 4️⃣ Энергия иона
        double ionMass = ion.getMass();
        double ionEnergy = eCharge * req.plasmaVoltage();

        // 5️⃣ Потенциал (важно!)
        PotentialParameters potential = null;
        if (req.potential() != null) {
            potential = potentialService.computePotential(req.potential());
        }

        // 6️⃣ Столкновения
        double totalTransferred = 0.0;
        List<CollisionResult> collisions = new ArrayList<>();
        Map<Integer, Double> atomListCache = new java.util.HashMap<>();

        for (Atom atom : atoms) {

            Integer atomListId = atom.getAtomList().getId();
            double atomMass = atomListCache.computeIfAbsent(atomListId, id ->
                    atomListRepository.findById(id)
                            .map(AtomList::getMass)
                            .orElse(0.0)
            );

            CollisionDto cDto = new CollisionDto(
                    ionEnergy,
                    ionMass,
                    atomMass,
                    req.impactAngle(),
                    potential,
                    req.latticeStructure()
            );

            CollisionResult result = collisionService.simulateCollision(cDto);
            if (result != null) {
                collisions.add(result);
                totalTransferred += result.transferredEnergy();
            }
        }

        double avgTransferredPerAtom = totalTransferred / Math.max(atoms.size(), 1);
        double estimatedTemperature = avgTransferredPerAtom / kB;

        // 7️⃣ Тепловое расслабление
        ThermalDto thermalDto = new ThermalDto(
                estimatedTemperature,
                req.thermalConductivity(),
                req.totalTime(),
                req.timeStep(),
                potential,
                req.latticeStructure()
        );

        List<Double> coolingProfile = thermalService.simulateCooling(thermalDto);
        double finalTemperature = coolingProfile.isEmpty()
                ? estimatedTemperature
                : coolingProfile.get(coolingProfile.size() - 1);

        // 8️⃣ Диффузия
        double D0 = req.diffusionPrefactor();
        double Q = req.activationEnergy();
        double diffusionCoefficient = D0 * Math.exp(-Q / (R * Math.max(1.0, finalTemperature)));

        double DX = 1e-9;
        double dt = STABILITY_LIMIT * DX * DX / diffusionCoefficient;

        if (dt < MIN_DT) {
            DX = Math.sqrt(MIN_DT * diffusionCoefficient / STABILITY_LIMIT);
            dt = MIN_DT;
            if (DX < MIN_DX) DX = MIN_DX;
            log.warn("Auto-adjust DX/DT: DX={}, dt={}", DX, dt);
        }

        DiffusionRequest diffReq = new DiffusionRequest(
                diffusionCoefficient,
                req.surfaceConcentration(),
                req.totalTime(),
                req.depth(),
                DX,
                dt,
                potential,
                req.latticeStructure()
        );

        DiffusionProfileDto diffusion = diffusionService.calculateDiffusionProfile(diffReq);
        if (diffusion == null || diffusion.depths().isEmpty()) {
            diffusion = new DiffusionProfileDto(List.of(0.0), List.of(req.surfaceConcentration()));
        }

        // 9️⃣ Финальный результат
        SimulationResultDto result = new SimulationResultDto(
                ion.getName(),
                atoms.get(0).getAtomList().getAtomName(),
                totalTransferred,
                avgTransferredPerAtom,
                finalTemperature,
                diffusionCoefficient,
                plasmaParams,
                collisions.stream().map(CollisionResult::transferredEnergy).toList(),
                diffusion,
                coolingProfile
        );

        // 1️⃣0️⃣ Сохранение результата
        Result entity = new Result();
        entity.setConfig(config);
        entity.setIon(ion);
        entity.setEnergy(totalTransferred);
        entity.setPotential(req.plasmaVoltage());
        entity.setTemperature(finalTemperature);
        resultRepository.save(entity);

        return result;
    }
}
