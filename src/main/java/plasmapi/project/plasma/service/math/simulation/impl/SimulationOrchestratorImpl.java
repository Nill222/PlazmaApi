package plasmapi.project.plasma.service.math.simulation.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.repository.AtomListRepository;
import plasmapi.project.plasma.repository.IonRepository;
import plasmapi.project.plasma.service.math.diffusion.DiffusionProfile;
import plasmapi.project.plasma.service.math.diffusion.impl.DiffusionServiceImpl;
import plasmapi.project.plasma.service.math.simulation.SimulationOrchestratorService;
import plasmapi.project.plasma.service.math.simulation.SimulationRequest;
import plasmapi.project.plasma.service.math.simulation.SimulationResult;

@Service
@RequiredArgsConstructor
public class SimulationOrchestratorImpl implements SimulationOrchestratorService {

    private final AtomListRepository atomRepo;
    private final IonRepository ionRepo;
    private final DiffusionServiceImpl diffusionService;

    // Значения по умолчанию для теплофизических свойств (TODO: получать из БД)
    private static final double DEFAULT_DENSITY = 7800.0;          // кг/м³ (сталь)
    private static final double DEFAULT_HEAT_CAPACITY = 500.0;    // Дж/(кг·К)
    private static final double DEFAULT_THERMAL_CONDUCTIVITY = 20.0; // Вт/(м·К)
    private static final double DEFAULT_SURFACE_BINDING_ENERGY = 3.0; // эВ
    private static final double DEFAULT_AMBIENT_TEMP = 300.0;      // К

    @Override
    public SimulationResult runSimulation(SimulationRequest request) {
        // 1. Поиск атома по названию (atom_name)
        AtomList atom = atomRepo.findById(request.getAtomId())
                .orElseThrow(() -> new IllegalArgumentException("Атом не найден: " + request.getAtomId()));

        // 2. Поиск иона по названию
        Ion ion = ionRepo.findById(request.getIonId())
                .orElseThrow(() -> new IllegalArgumentException("Ион не найден: " + request.getIonId()));

        // 3. Создание конфигурации плазмы из данных запроса
        PlasmaConfiguration plasmaConfig = new PlasmaConfiguration();
        plasmaConfig.setVoltage(request.getVoltage());
        plasmaConfig.setCurrent(request.getCurrent());
        plasmaConfig.setChamberWidth(request.getChamberWidth());
        plasmaConfig.setChamberDepth(request.getChamberDepth());
        plasmaConfig.setIonIncidenceAngle(request.getAngle());
        plasmaConfig.setSurfaceBindingEnergy(DEFAULT_SURFACE_BINDING_ENERGY);
        // Теплофизические свойства пока из констант
        plasmaConfig.setDensity(DEFAULT_DENSITY);
        plasmaConfig.setHeatCapacity(DEFAULT_HEAT_CAPACITY);
        plasmaConfig.setThermalConductivity(DEFAULT_THERMAL_CONDUCTIVITY);
        plasmaConfig.setTargetTemperature(request.getAmbientTemp() != null ? request.getAmbientTemp() : DEFAULT_AMBIENT_TEMP);

        // 4. Температура окружающей среды
        double ambientTemp = request.getAmbientTemp() != null ? request.getAmbientTemp() : DEFAULT_AMBIENT_TEMP;

        // 5. Запуск диффузионного расчёта
        DiffusionProfile profile = diffusionService.calculateProfile(
                atom,
                ion,
                plasmaConfig,
                request.getExposureTime(),
                ambientTemp
        );

        // 6. Формирование результата
        return new SimulationResult(profile, atom, ion, plasmaConfig);
    }
}