package plasmapi.project.plasma.service.math.simulation.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.PhysicalConstants;
import plasmapi.project.plasma.service.math.diffusion.*;
import plasmapi.project.plasma.service.math.ion.IonComposition;
import plasmapi.project.plasma.service.math.plazma.PlasmaResult;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;
import plasmapi.project.plasma.service.math.simulation.*;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SimulationOrchestratorImpl implements SimulationOrchestratorService {

    private final PlasmaService plasmaService;
    private final DiffusionService diffusionService;

    @Override
    public SimulationResult runSimulation(SimulationRequest request) {

        // =========================
        // 1. ATOM (обязателен)
        // =========================
        AtomList atom = requireAtom(request.getAtomId());

        // =========================
        // 2. ION (обязателен)
        // =========================
        Ion ion = requireIon(request.getIonId());

        // =========================
        // 3. ALLOY (опционально)
        // =========================
        AlloyComposition alloy = null;
        if (request.getComposition() != null && !request.getComposition().isEmpty()) {
            alloy = buildAlloy(request.getComposition());
        }

        // =========================
        // 4. PLASMA CONFIG (ТОЛЬКО ИЗ ВХОДА)
        // =========================
        PlasmaConfiguration cfg = buildConfig(request);

        double ambientTemp = request.getAmbientTemp() != null
                ? request.getAmbientTemp()
                : cfg.getTargetTemperature();

        double exposureTime = cfg.getExposureTime();
        if (exposureTime <= 0) {
            throw new IllegalArgumentException("Exposure time must be > 0");
        }

        // =========================
        // 5. PLASMA CALCULATION
        // =========================
        PlasmaResult plasma = plasmaService.calculate(
                cfg,
                ion,
                null,
                null
        );

        // =========================
        // 6. DIFFUSION PROFILE
        // =========================
        IonComposition ionComp = null; // если появится — прокинем

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
    private PlasmaConfiguration buildConfig(SimulationRequest r) {

        PlasmaConfiguration cfg = new PlasmaConfiguration();

        cfg.setVoltage(r.getVoltage());
        cfg.setCurrent(r.getCurrent());
        cfg.setPressure(r.getPressure());
        cfg.setElectronTemperature(r.getElectronTemp());
        cfg.setExposureTime(r.getExposureTime());

        cfg.setChamberWidth(r.getChamberWidth());
        cfg.setChamberDepth(r.getChamberDepth());
        cfg.setIonIncidenceAngle(r.getAngle());

        // ❗ ВСЁ, что не пришло — НЕ придумываем
        cfg.setTargetTemperature(r.getAmbientTemp());
        cfg.setDensity(null);
        cfg.setHeatCapacity(null);
        cfg.setThermalConductivity(null);
        cfg.setSurfaceBindingEnergy(null);

        return cfg;
    }

    // =========================================================
    // ALLOY
    // =========================================================
    private AlloyComposition buildAlloy(List<AlloyComponentDto> dtoList) {

        List<AlloyComponent> list = new ArrayList<>();

        double sum = 0.0;

        for (AlloyComponentDto dto : dtoList) {

            AtomList atom = requireAtom(dto.getAtomId());

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
    // ATOM / ION LOADERS
    // =========================================================
    private AtomList requireAtom(Integer id) {
        if (id == null) throw new IllegalArgumentException("atomId is null");
        // предполагается repository inject (не показан)
        throw new UnsupportedOperationException("inject AtomListRepository");
    }

    private Ion requireIon(Integer id) {
        if (id == null) throw new IllegalArgumentException("ionId is null");
        // предполагается repository inject (не показан)
        throw new UnsupportedOperationException("inject IonRepository");
    }
}