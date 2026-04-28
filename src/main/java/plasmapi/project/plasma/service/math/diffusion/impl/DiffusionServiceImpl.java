package plasmapi.project.plasma.service.math.diffusion.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.PhysicalConstants;
import plasmapi.project.plasma.service.math.PhysicsStats;
import plasmapi.project.plasma.service.math.diffusion.*;
import plasmapi.project.plasma.service.math.ion.IonCollisionAveragingService;
import plasmapi.project.plasma.service.math.ion.IonComposition;
import plasmapi.project.plasma.service.math.plazma.PlasmaResult;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;
import plasmapi.project.plasma.service.math.potential.PotentialService;
import plasmapi.project.plasma.service.math.resonanse.ResonanceService;
import plasmapi.project.plasma.service.math.slr.SLRService;
import plasmapi.project.plasma.service.math.thermal.ThermalResult;
import plasmapi.project.plasma.service.math.thermal.ThermalService;
import plasmapi.project.plasma.service.math.thermal.impl.ThermalServiceImpl;
import plasmapi.project.plasma.service.math.transport.IonTransportService;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiffusionServiceImpl implements DiffusionService {

    private final PotentialService potentialService;
    private final PlasmaService plasmaService;
    private final ThermalService thermalService;
    private final SLRService slrService;
    private final ResonanceService resonanceService;
    private final IonCollisionAveragingService ionCollisionAveragingService;
    private final IonTransportService ionTransportService;

    private static final double R = PhysicalConstants.R;
    private static final double NA = PhysicalConstants.NA;
    private static final double EV = PhysicalConstants.EV;

    private static final double MIN_D = 1e-40;
    private static final double MAX_D = 1e-6;
    private static final double DEFAULT_IMPACT_PARAMETER_FACTOR = 0.5;

    @Override
    public DiffusionProfile calculateProfile(
            AtomList atom,
            AlloyComposition alloy,
            Ion ion,
            IonComposition ionComp,
            PlasmaConfiguration plasmaConfig,
            double exposureTime,
            double ambientTemp
    ) {

        boolean isAlloy = alloy != null && !alloy.getComponents().isEmpty();

        // =========================
        // 1. THERMAL
        // =========================
        ThermalDtoAdapter adapter = new ThermalDtoAdapter(plasmaConfig, ambientTemp, exposureTime);

        ThermalResult thermal = thermalService.simulate(
                plasmaConfig,
                adapter.getT0(),
                adapter.getTMax(),
                adapter.getDt(),
                adapter.getThickness(),
                adapter.getPowerInput(),
                adapter.getProjectedRange(),
                adapter.getBoundaryCondition(),
                ambientTemp,
                adapter.getH(),
                adapter.getN(),
                adapter.getDebyeTemperature(atom),
                adapter.getProbeDepth(),
                adapter.isThermalCyclingEnabled(),
                adapter.getCyclePeriod(),
                adapter.getDutyCycle()
        );

        double finalT = thermal.finalProbeTemperature();

        // =========================
        // 2. PLASMA
        // =========================
        PlasmaResult plasma = plasmaService.calculate(plasmaConfig, ion, ionComp, null);

        double ionEnergyEv = plasma.ionEnergyEv();
        double ionFlux = plasma.ionFlux();
        double fluence = ionFlux * exposureTime;

        // =========================
        // 3. D0 (alloy-aware)
        // =========================
        double D1 = 0.0;
        double D2 = 0.0;

        if (!isAlloy) {
            D1 = atom.getPackingFactor1() != null ? atom.getPackingFactor1() : 1e-18;
            D2 = atom.getPackingFactor2() != null ? atom.getPackingFactor2() : 1e-19;
        } else {
            for (AlloyComponent c : alloy.getComponents()) {
                double x = c.getFraction();
                AtomList a = c.getAtom();

                D1 += x * (a.getPackingFactor1() != null ? a.getPackingFactor1() : 1e-18);
                D2 += x * (a.getPackingFactor2() != null ? a.getPackingFactor2() : 1e-19);
            }
        }

        // =========================
        // 4. ACTIVATION ENERGY
        // =========================
        double Q1 = 0.0;
        double Q2 = 0.0;

        if (!isAlloy) {
            Q1 = getActivationEnergy(atom, true);
            Q2 = getActivationEnergy(atom, false);
        } else {
            for (AlloyComponent c : alloy.getComponents()) {
                double x = c.getFraction();
                Q1 += x * getActivationEnergy(c.getAtom(), true);
                Q2 += x * getActivationEnergy(c.getAtom(), false);
            }
        }

        // =========================
        // 5. POTENTIAL (alloy-aware)
        // =========================
        double stiffness;
        double re;

        if (!isAlloy) {
            PotentialParameters p = potentialService.computePotential(atom.getA() * 1e-10, atom);
            stiffness = p.stiffness();
            re = p.re();
        } else {
            stiffness = computeEffectiveStiffness(alloy);
            re = computeEffectiveRe(alloy);
        }

        // =========================
        // 6. THERMAL DIFFUSION
        // =========================
        double D_thermal = clamp(
                (D1 * Math.exp(-Q1 / (R * finalT)) +
                        D2 * Math.exp(-Q2 / (R * finalT)))
        );

        // =========================
// 7. COLLISION → DPA
// =========================

        double Esurf = plasmaConfig.getSurfaceBindingEnergy() != null
                ? plasmaConfig.getSurfaceBindingEnergy()
                : 3.0;

        double impactParam = re * DEFAULT_IMPACT_PARAMETER_FACTOR;

        CollisionResult collision = ionCollisionAveragingService.compute(
                ionComp,
                alloy,
                atom,
                ion,
                ionEnergyEv,
                impactParam,
                Esurf
        );

        double transferredJ = collision.transferredEnergy() * EV;

        double Ed = 25.0 * EV;

// ❗ исправлено (убран двойной κ)
        double efficiency = 0.3; // 0.2–0.4
        double Nd = efficiency * transferredJ / (2.0 * Ed);

        double damageRate = Nd * ionFlux; // defects / m² / s

        double jumpDistance = re;

// ✔ SRIM-like radiation diffusion
        double D_rad = (1.0 / 6.0) * damageRate * jumpDistance * jumpDistance;
// ✔ каскадная длина

        double D_collision = clamp(D_thermal + D_rad);

// =========================
// 8. SLR
// =========================

        double thetaRad = Math.toRadians(plasmaConfig.getIonIncidenceAngle());

        double slrFactor = slrService.computeFactor(
                fluence,
                thetaRad,
                collision,
                Esurf
        );

        double D_slr = (slrFactor - 1.0) * D_collision;
        if (D_slr < 0) D_slr = 0.0;

// =========================
// 9. RESONANCE
// =========================

        double xi = resonanceService.computeXi(atom, ionEnergyEv);

// ✔ физически корректнее
        double D_res = D_collision * (xi - 1.0);

        if (D_res < 0) D_res = 0;
        // =========================
// 10. EFFECTIVE DIFFUSION
// =========================

        double D_effective = clamp(
                D_collision + D_slr + D_res
        );

// =========================
// 11. RANGE (🔥 главное исправление)
// =========================

        var transport = ionTransportService.simulate(
                ion,
                atom,
                ionEnergyEv,
                200
        );

        double Rp_mc = transport.meanRange();
        double Rp_model = estimateProjectedRange(ion, atom, ionEnergyEv);

// 🔥 гибрид (очень важно)
        double Rp = 0.7 * Rp_model + 0.3 * Rp_mc;
        double sigma_model = 0.3 * Rp; // SRIM-типичное соотношение

        double sigmaRp = 0.5 * sigma_model + 0.5 * transport.straggle();
// ✔ итоговая ширина
        double sigma = Math.sqrt(
                sigmaRp * sigmaRp +
                        2.0 * D_effective * exposureTime
        );

        if (sigma < 1e-12) sigma = 1e-12;

// =========================
// 12. PROFILE (normalized)
// =========================

        List<Double> depths = new ArrayList<>();
        List<Double> conc = new ArrayList<>();

        double maxDepth = 5 * (Rp + sigma);
        double dx = maxDepth / 199;

        if (fluence <= 0) {
            fluence = 1e10;
        }

        double norm = fluence / (Math.sqrt(2 * Math.PI) * sigma);
        for (int i = 0; i < 200; i++) {
            double x = i * dx;

            double c = norm * Math.exp(
                    -(x - Rp) * (x - Rp) / (2 * sigma * sigma)
            );

            depths.add(x);
            conc.add(c);
        }

        double meanDepth = Rp;

        // =========================
// 13. РАСЧЕТ ДОП. ПАРАМЕТРОВ (NEW)
// =========================

// 1. Плотность тока
        double area = (plasmaConfig.getChamberWidth() != null && plasmaConfig.getChamberDepth() != null)
                ? plasmaConfig.getChamberWidth() * plasmaConfig.getChamberDepth()
                : 1.0;
        double currentDensityValue = (plasmaConfig.getCurrent() != null)
                ? plasmaConfig.getCurrent() / area
                : 0.0;

// 2. Параметры электронов
        double Te_ev = (plasmaConfig.getElectronTemperature() != null)
                ? plasmaConfig.getElectronTemperature()
                : 5.0; // Эв (типичное значение для тлеющего разряда)
        double me = 9.109e-31;
        double electronVelocity = Math.sqrt(8.0 * EV * Te_ev / (Math.PI * me));

// n_e ≈ ionFlux / v_ion (м⁻³)
        double v_ion = Math.sqrt(2.0 * ionEnergyEv * EV / ion.getMass());
        double electronDensity = ionFlux / Math.max(v_ion, 1e-6);

// 3. Энергетика
        double totalTransferred = collision.transferredEnergy() * fluence;
        double avgTransferred = collision.transferredEnergy();

// 4. Повреждения и смещения
        double totalDamage = Nd * fluence; // суммарные дефекты на м²
        double totalDisplacement = totalDamage * re; // "суммарный путь" смещенных атомов

// 5. Импульс
// p = sqrt(2 * m * E_kin)
        double momentumPerIon = Math.sqrt(2.0 * ion.getMass() * (collision.transferredEnergy() * EV));
        double totalMomentum = momentumPerIon * fluence;

        PhysicsStats stats = new PhysicsStats(
                electronDensity,
                electronVelocity,
                currentDensityValue,
                Esurf,
                totalTransferred,
                avgTransferred,
                totalDamage,
                totalMomentum,
                totalDisplacement
        );

        return new DiffusionProfile(
                D1, D2,
                Q1 / (NA * EV),
                Q2 / (NA * EV),
                D_thermal,
                D_effective,
                meanDepth,
                depths,
                conc,
                stats
        );
    }

    // =========================
    // UTILS
    // =========================

    private double clamp(double D) {
        if (Double.isNaN(D) || D < MIN_D) return MIN_D;
        return Math.min(D, MAX_D);
    }

    /**
     * Физически более корректная энергия активации
     */
    private double getActivationEnergy(AtomList atom, boolean first) {
        Double cohEv = first
                ? atom.getCohesiveEnergyEv1()
                : atom.getCohesiveEnergyEv2();

        if (cohEv == null) cohEv = 4.3;

        double fraction = first ? 0.35 : 0.20;

        return cohEv * EV * NA * fraction;
    }

    /**
     * Эффективная жёсткость сплава
     */
    private double computeEffectiveStiffness(AlloyComposition alloy) {
        double result = 0.0;
        var comps = alloy.getComponents();

        for (int i = 0; i < comps.size(); i++) {
            for (AlloyComponent comp : comps) {

                double xi = comps.get(i).getFraction();
                double xj = comp.getFraction();

                double ki = potentialService.computePotential(
                        comps.get(i).getAtom().getA() * 1e-10,
                        comps.get(i).getAtom()
                ).stiffness();

                double kj = potentialService.computePotential(
                        comp.getAtom().getA() * 1e-10,
                        comp.getAtom()
                ).stiffness();

                result += xi * xj * Math.sqrt(ki * kj);
            }
        }

        return result;
    }

    /**
     * Эффективное расстояние
     */
    private double computeEffectiveRe(AlloyComposition alloy) {
        double result = 0.0;
        var comps = alloy.getComponents();

        for (int i = 0; i < comps.size(); i++) {
            for (AlloyComponent comp : comps) {

                double xi = comps.get(i).getFraction();
                double xj = comp.getFraction();

                double rei = potentialService.computePotential(
                        comps.get(i).getAtom().getA() * 1e-10,
                        comps.get(i).getAtom()
                ).re();

                double rej = potentialService.computePotential(
                        comp.getAtom().getA() * 1e-10,
                        comp.getAtom()
                ).re();

                result += xi * xj * ((rei + rej) / 2.0);
            }
        }

        return result;
    }

    /**
     * Thermal adapter
     */
    private static class ThermalDtoAdapter {
        private final PlasmaConfiguration cfg;
        private final double ambientTemp;
        private final double exposureTime;

        ThermalDtoAdapter(PlasmaConfiguration cfg, double ambientTemp, double exposureTime) {
            this.cfg = cfg;
            this.ambientTemp = ambientTemp;
            this.exposureTime = exposureTime;
        }

        double getT0() {
            return cfg.getTargetTemperature() != null
                    ? cfg.getTargetTemperature()
                    : ambientTemp;
        }

        double getTMax() {
            return exposureTime;
        }

        double getDt() {
            return 0.01 * exposureTime;
        }

        double getThickness() {
            return 0.001;
        }

        Double getPowerInput() {
            if (cfg.getVoltage() == null || cfg.getCurrent() == null) {
                return null;
            }
            double power = cfg.getVoltage() * cfg.getCurrent();
            double area = 1.0;
            if (cfg.getChamberWidth() != null && cfg.getChamberDepth() != null
                    && cfg.getChamberWidth() > 0 && cfg.getChamberDepth() > 0) {
                area = cfg.getChamberWidth() * cfg.getChamberDepth();
            }
            // Возвращаем удельный поток мощности, Вт/м^2.
            return power / area;
        }

        Double getProjectedRange() {
            return 10e-9;
        }

        ThermalServiceImpl.BoundaryCondition getBoundaryCondition() {
            return ThermalServiceImpl.BoundaryCondition.ADIABATIC;
        }

        double getH() {
            return 0.0;
        }

        Integer getN() {
            return null;
        }

        Double getDebyeTemperature(AtomList atom) {
            return atom != null ? atom.getDebyeTemperature() : null;
        }

        Double getProbeDepth() {
            return getProjectedRange();
        }

        boolean isThermalCyclingEnabled() {
            return cfg.getVoltage() != null && cfg.getCurrent() != null
                    && cfg.getVoltage() > 0 && cfg.getCurrent() > 0;
        }

        Double getCyclePeriod() {
            return Math.max(exposureTime / 20.0, 1e-6);
        }

        Double getDutyCycle() {
            return 0.5;
        }
    }

    private double estimateProjectedRange(Ion ion, AtomList atom, double E_ev) {

        int Z1 = Math.max(1, ion.getCharge());
        int Z2 = Math.max(1, atom.getValence());

        double M1 = ion.getMass();
        double M2 = atom.getMass();

        // reduced energy
        double eps = 0.03255 * M2 / (Z1 * Z2 * (M1 + M2)) * E_ev;

        // универсальная функция пробега (приближение)
        double g = Math.log(1 + 1.138 * eps) /
                (eps + 0.01321 * Math.pow(eps, 0.21226)
                        + 0.19593 * Math.sqrt(eps));

        double a = 0.8853 * 0.529e-10 /
                (Math.pow(Z1, 0.23) + Math.pow(Z2, 0.23));

        double Rp = (M1 / (M1 + M2)) * a * g * E_ev;

        return Math.max(Rp, 1e-10);
    }
}
