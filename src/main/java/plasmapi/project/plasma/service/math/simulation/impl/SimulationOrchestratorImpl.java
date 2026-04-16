package plasmapi.project.plasma.service.math.simulation.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.repository.AtomListRepository;
import plasmapi.project.plasma.repository.IonRepository;
import plasmapi.project.plasma.service.math.diffusion.*;
import plasmapi.project.plasma.service.math.ion.IonComponent;
import plasmapi.project.plasma.service.math.ion.IonComposition;
import plasmapi.project.plasma.service.math.plazma.PlasmaResult;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;
import plasmapi.project.plasma.service.math.simulation.*;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SimulationOrchestratorImpl implements SimulationOrchestratorService {

    private final AtomListRepository atomRepository;
    private final IonRepository ionRepository;

    private final PlasmaService plasmaService;
    private final DiffusionService diffusionService;

    @Override
    public SimulationResult runSimulation(SimulationRequest request) {

        // =========================
        // 1. ATOM
        // =========================
        AtomList atom = getAtomOrThrow(request.getAtomId());

        // =========================
        // 2. ION (fallback)
        // =========================
        Ion ion = getIonOrThrow(request.getIonId());

        // =========================
        // 3. ALLOY
        // =========================
        AlloyComposition alloy = null;
        if (request.getComposition() != null && !request.getComposition().isEmpty()) {
            alloy = buildAlloy(request.getComposition());
        }

        // =========================
        // 4. ION COMPOSITION (🔥 теперь есть)
        // =========================
        IonComposition ionComp = null;
        if (request.getIonComposition() != null && !request.getIonComposition().isEmpty()) {
            ionComp = buildIonComposition(request.getIonComposition());
        }

        // =========================
        // 5. CONFIG
        // =========================
        PlasmaConfiguration cfg = buildConfig(request, atom);

        double ambientTemp = request.getAmbientTemp() != null
                ? request.getAmbientTemp()
                : cfg.getTargetTemperature();

        double exposureTime = cfg.getExposureTime();
        if (exposureTime <= 0) {
            throw new IllegalArgumentException("Exposure time must be > 0");
        }

        // =========================
        // 6. PLASMA
        // =========================
        PlasmaResult plasma = plasmaService.calculate(
                cfg,
                ion,
                ionComp,
                null
        );

        // сохраняем рассчитанную энергию
        cfg.setIonEnergyOverride(plasma.ionEnergyEv());

        // =========================
        // 7. DIFFUSION
        // =========================
        DiffusionProfile profile = diffusionService.calculateProfile(
                atom,
                alloy,
                ion,
                ionComp,
                cfg,
                exposureTime,
                ambientTemp
        );

        return new SimulationResult(profile, atom, ion, cfg);
    }

    // =========================================================
    // CONFIG
    // =========================================================
    private PlasmaConfiguration buildConfig(SimulationRequest r, AtomList atom) {

        PlasmaConfiguration cfg = new PlasmaConfiguration();

        cfg.setVoltage(r.getVoltage());
        cfg.setCurrent(r.getCurrent());
        cfg.setPressure(r.getPressure());
        cfg.setElectronTemperature(r.getElectronTemp());
        cfg.setExposureTime(r.getExposureTime());

        cfg.setChamberWidth(r.getChamberWidth());
        cfg.setChamberDepth(r.getChamberDepth());
        cfg.setIonIncidenceAngle(r.getAngle());

        cfg.setTargetTemperature(r.getAmbientTemp());

        // =========================
        // ФИЗИЧЕСКИЕ СВОЙСТВА (из БД)
        // =========================
        if (atom.getDsteny() == null)
            throw new IllegalStateException("Density missing for atom " + atom.getId());

        if (atom.getHeatCapacity() == null)
            throw new IllegalStateException("Heat capacity missing for atom " + atom.getId());

        if (atom.getThermalConductivity() == null)
            throw new IllegalStateException("Thermal conductivity missing for atom " + atom.getId());

        cfg.setDensity(atom.getDsteny());
        cfg.setHeatCapacity(atom.getHeatCapacity());
        cfg.setThermalConductivity(atom.getThermalConductivity());

        return cfg;
    }

    // =========================================================
    // ALLOY
    // =========================================================
    private AlloyComposition buildAlloy(List<AlloyComponentDto> dtoList) {

        List<AlloyComponent> list = new ArrayList<>();
        double sum = 0.0;

        for (AlloyComponentDto dto : dtoList) {

            AtomList atom = getAtomOrThrow(dto.getAtomId());

            double x = dto.getFraction();
            if (x <= 0) {
                throw new IllegalArgumentException("Fraction must be > 0");
            }

            list.add(new AlloyComponent(atom, x));
            sum += x;
        }

        if (Math.abs(sum - 1.0) > 1e-6) {
            throw new IllegalArgumentException("Alloy fractions must sum to 1.0");
        }

        return new AlloyComposition(list);
    }

    // =========================================================
    // ION COMPOSITION (🔥 новое)
    // =========================================================
    private IonComposition buildIonComposition(List<IonComponent> dtoList) {

        List<IonComponent> list = new ArrayList<>();
        double sum = 0.0;

        for (IonComponent dto : dtoList) {

            Ion ion = getIonOrThrow(dto.getIon().getId());

            double x = dto.getFraction();
            if (x <= 0) {
                throw new IllegalArgumentException("Ion fraction must be > 0");
            }

            list.add(new IonComponent(ion, x));
            sum += x;
        }

        if (Math.abs(sum - 1.0) > 1e-6) {
            throw new IllegalArgumentException("Ion fractions must sum to 1.0");
        }

        return new IonComposition(list);
    }

    // =========================================================
    // DB ACCESS
    // =========================================================
    private AtomList getAtomOrThrow(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException("atomId is null");
        }

        return atomRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Atom not found: " + id)
                );
    }

    private Ion getIonOrThrow(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException("ionId is null");
        }

        return ionRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Ion not found: " + id)
                );
    }
}