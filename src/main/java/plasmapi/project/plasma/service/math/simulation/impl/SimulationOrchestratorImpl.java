package plasmapi.project.plasma.service.math.simulation.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.repository.AtomListRepository;
import plasmapi.project.plasma.repository.IonRepository;
import plasmapi.project.plasma.service.PhysicalConstants;
import plasmapi.project.plasma.service.math.diffusion.DiffusionProfile;
import plasmapi.project.plasma.service.math.diffusion.DiffusionService;
import plasmapi.project.plasma.service.math.plazma.PlasmaResult;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;
import plasmapi.project.plasma.service.math.simulation.SimulationOrchestratorService;
import plasmapi.project.plasma.service.math.simulation.SimulationRequest;
import plasmapi.project.plasma.service.math.simulation.SimulationResult;

@Service
@RequiredArgsConstructor
public class SimulationOrchestratorImpl implements SimulationOrchestratorService {

    private final AtomListRepository atomRepo;
    private final IonRepository ionRepo;
    private final PlasmaService plasmaService;
    private final DiffusionService diffusionService;

    // Значения по умолчанию (если в БД отсутствуют)
    private static final double DEFAULT_DENSITY = 7800.0;             // кг/м³
    private static final double DEFAULT_CP = 500.0;                   // Дж/(кг·К)
    private static final double DEFAULT_K = 20.0;                     // Вт/(м·К)
    private static final double DEFAULT_SURFACE_BINDING = 3.0;        // эВ
    private static final double DEFAULT_AMBIENT = 300.0;              // К

    @Override
    public SimulationResult runSimulation(SimulationRequest request) {

        // 1️⃣ Материал
        AtomList atom = atomRepo.findById(request.getAtomId())
                .orElseThrow(() -> new IllegalArgumentException("Atom not found"));

        // 2️⃣ Ион
        Ion ion = ionRepo.findById(request.getIonId())
                .orElseThrow(() -> new IllegalArgumentException("Ion not found"));

        // 3️⃣ Температура окружающей среды
        double ambientTemp = request.getAmbientTemp() != null
                ? request.getAmbientTemp()
                : DEFAULT_AMBIENT;

        // 4️⃣ Формируем PlasmaConfiguration (только процесс!)
        PlasmaConfiguration cfg = new PlasmaConfiguration();

        cfg.setVoltage(request.getVoltage());
        cfg.setCurrent(request.getCurrent());
        cfg.setPressure(request.getPressure());
        cfg.setElectronTemperature(request.getElectronTemp());
        cfg.setExposureTime(request.getExposureTime());

        cfg.setChamberWidth(request.getChamberWidth());
        cfg.setChamberDepth(request.getChamberDepth());
        cfg.setIonIncidenceAngle(request.getAngle());

        // Материальные свойства (пока дефолт, позже можно в БД)
        cfg.setDensity(DEFAULT_DENSITY);
        cfg.setHeatCapacity(DEFAULT_CP);
        cfg.setThermalConductivity(DEFAULT_K);
        cfg.setSurfaceBindingEnergy(DEFAULT_SURFACE_BINDING);
        cfg.setTargetTemperature(ambientTemp);

        // 5️⃣ Расчёт параметров плазмы
        PlasmaResult plasma = plasmaService.calculate(cfg, ion, null);

        double ionEnergyEv = plasma.ionEnergyEv();
        double ionFlux = plasma.ionFlux();                // ион/(м²·с)
        double exposureTime = request.getExposureTime();

        // 6️⃣ Мощность на поверхность (Вт/м²)
        // P = Γ * E * e
        double ionEnergyJ = ionEnergyEv * PhysicalConstants.EV;
        double powerDensity = ionFlux * ionEnergyJ;      // Вт/м²

        // 7️⃣ Переводим в powerInput для ThermalService
        // ThermalService считает что powerInput — Вт/м²
        // Поэтому передаём именно powerDensity
        cfg.setIonEnergyOverride(ionEnergyEv); // фиксируем чтобы DiffusionService использовал то же

        // 8️⃣ Защита от безумного dt
        if (exposureTime <= 0)
            throw new IllegalArgumentException("Exposure time must be positive");

        // 9️⃣ Запуск диффузии
        DiffusionProfile profile = diffusionService.calculateProfile(
                atom,
                ion,
                cfg,
                exposureTime,
                ambientTemp
        );

        return new SimulationResult(profile, atom, ion, cfg);
    }
}
