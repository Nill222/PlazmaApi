package plasmapi.project.plasma.service.math.simulation.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.repository.AtomListRepository;
import plasmapi.project.plasma.repository.IonRepository;
import plasmapi.project.plasma.service.PhysicalConstants;
import plasmapi.project.plasma.service.math.diffusion.AlloyComponent;
import plasmapi.project.plasma.service.math.diffusion.AlloyComposition;
import plasmapi.project.plasma.service.math.diffusion.DiffusionProfile;
import plasmapi.project.plasma.service.math.diffusion.DiffusionService;
import plasmapi.project.plasma.service.math.plazma.PlasmaResult;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;
import plasmapi.project.plasma.service.math.simulation.SimulationOrchestratorService;
import plasmapi.project.plasma.service.math.simulation.SimulationRequest;
import plasmapi.project.plasma.service.math.simulation.SimulationResult;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SimulationOrchestratorImpl implements SimulationOrchestratorService {

    private final AtomListRepository atomRepo;
    private final IonRepository ionRepo;
    private final PlasmaService plasmaService;
    private final DiffusionService diffusionService;

    // Значения по умолчанию
    private static final double DEFAULT_DENSITY = 7800.0;
    private static final double DEFAULT_CP = 500.0;
    private static final double DEFAULT_K = 20.0;
    private static final double DEFAULT_SURFACE_BINDING = 3.0;
    private static final double DEFAULT_AMBIENT = 300.0;

    @Override
    public SimulationResult runSimulation(SimulationRequest request) {

        // =========================
        // 1️⃣ MATERIAL (atom fallback)
        // =========================
        AtomList atom = null;

        if (request.getAtomId() != null) {
            atom = atomRepo.findById(request.getAtomId())
                    .orElseThrow(() -> new IllegalArgumentException("Atom not found"));
        }

        // =========================
        // 2️⃣ ION
        // =========================
        Ion ion = ionRepo.findById(request.getIonId())
                .orElseThrow(() -> new IllegalArgumentException("Ion not found"));

        // =========================
        // 3️⃣ TEMPERATURE
        // =========================
        double ambientTemp = request.getAmbientTemp() != null
                ? request.getAmbientTemp()
                : DEFAULT_AMBIENT;

        // =========================
        // 4️⃣ ALLOY BUILD 🔥
        // =========================
        AlloyComposition alloy = null;

        if (request.getComposition() != null && !request.getComposition().isEmpty()) {

            List<AlloyComponent> components = request.getComposition().stream()
                    .map(c -> new AlloyComponent(
                            atomRepo.findById(c.getAtomId())
                                    .orElseThrow(() -> new IllegalArgumentException("Atom not found: " + c.getAtomId())),
                            c.getFraction()
                    ))
                    .toList();

            double sum = components.stream()
                    .mapToDouble(AlloyComponent::getFraction)
                    .sum();

            if (Math.abs(sum - 1.0) > 1e-6) {
                throw new IllegalArgumentException("Fractions must sum to 1");
            }

            alloy = new AlloyComposition(components);

            // fallback atom (важно для resonance и др.)
            if (atom == null) {
                atom = components.get(0).getAtom();
            }
        }

        // защита
        if (atom == null) {
            throw new IllegalArgumentException("Atom or composition must be provided");
        }

        // =========================
        // 5️⃣ CONFIG
        // =========================
        PlasmaConfiguration cfg = new PlasmaConfiguration();

        cfg.setVoltage(request.getVoltage());
        cfg.setCurrent(request.getCurrent());
        cfg.setPressure(request.getPressure());
        cfg.setElectronTemperature(request.getElectronTemp());
        cfg.setExposureTime(request.getExposureTime());

        cfg.setChamberWidth(request.getChamberWidth());
        cfg.setChamberDepth(request.getChamberDepth());
        cfg.setIonIncidenceAngle(request.getAngle());

        // material props
        cfg.setDensity(DEFAULT_DENSITY);
        cfg.setHeatCapacity(DEFAULT_CP);
        cfg.setThermalConductivity(DEFAULT_K);
        cfg.setSurfaceBindingEnergy(DEFAULT_SURFACE_BINDING);
        cfg.setTargetTemperature(ambientTemp);

        // =========================
        // 6️⃣ PLASMA
        // =========================
        PlasmaResult plasma = plasmaService.calculate(cfg, ion, null);

        double ionEnergyEv = plasma.ionEnergyEv();
        double ionFlux = plasma.ionFlux();
        double exposureTime = cfg.getExposureTime();

        if (exposureTime <= 0) {
            throw new IllegalArgumentException("Exposure time must be positive");
        }

        // =========================
        // 7️⃣ POWER (🔥 КЛЮЧЕВОЕ)
        // =========================
        double ionEnergyJ = ionEnergyEv * PhysicalConstants.EV;
        double powerDensity = ionFlux * ionEnergyJ;

        // 👉 теперь thermal реально работает
        cfg.setDensity(powerDensity);

        // фиксируем энергию для diffusion
        cfg.setIonEnergyOverride(ionEnergyEv);

        // =========================
        // 8️⃣ DIFFUSION
        // =========================
        DiffusionProfile profile = diffusionService.calculateProfile(
                atom,
                alloy,
                ion,
                cfg,
                exposureTime,
                ambientTemp
        );

        return new SimulationResult(profile, atom, ion, cfg);
    }
}