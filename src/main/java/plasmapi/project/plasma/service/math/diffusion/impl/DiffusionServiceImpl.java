package plasmapi.project.plasma.service.math.diffusion.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.PhysicalConstants;
import plasmapi.project.plasma.service.math.collision.CollisionService;
import plasmapi.project.plasma.service.math.diffusion.AlloyComponent;
import plasmapi.project.plasma.service.math.diffusion.AlloyComposition;
import plasmapi.project.plasma.service.math.diffusion.DiffusionProfile;
import plasmapi.project.plasma.service.math.diffusion.DiffusionService;
import plasmapi.project.plasma.service.math.plazma.PlasmaResult;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;
import plasmapi.project.plasma.service.math.potential.PotentialService;
import plasmapi.project.plasma.service.math.resonanse.ResonanceService;
import plasmapi.project.plasma.service.math.slr.SLRService;
import plasmapi.project.plasma.service.math.thermal.ThermalResult;
import plasmapi.project.plasma.service.math.thermal.ThermalService;
import plasmapi.project.plasma.service.math.thermal.impl.ThermalServiceImpl;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiffusionServiceImpl implements DiffusionService {

    private final PotentialService potentialService;
    private final CollisionService collisionService;
    private final PlasmaService plasmaService;
    private final ThermalService thermalService;
    private final SLRService slrService;
    private final ResonanceService resonanceService;

    private static final double R = PhysicalConstants.R;
    private static final double KB = PhysicalConstants.KB;
    private static final double NA = PhysicalConstants.NA;
    private static final double EV = PhysicalConstants.EV;

    private static final double MIN_D = 1e-40;
    private static final double MAX_D = 1e-6;
    private static final double ALPHA = 0.25;
    private static final double BETA = 1e-3;
    private static final double RADIATION_FACTOR = 20.0;
    private static final double SLR_COUPLING = 0.05;
    private static final double DEFAULT_IMPACT_PARAMETER_FACTOR = 0.5;

    public DiffusionProfile calculateProfile(
            AtomList atom,
            AlloyComposition alloy,
            Ion ion,
            PlasmaConfiguration plasmaConfig,
            double exposureTime,
            double ambientTemp
    ) {

        boolean isAlloy = alloy != null && alloy.getComponents() != null && !alloy.getComponents().isEmpty();

        // 1. Thermal
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
                adapter.getN()
        );

        List<Double> temps = thermal.times();
        double finalT = temps.get(temps.size() - 1);

        // 2. Plasma
        PlasmaResult plasma = plasmaService.calculate(plasmaConfig, ion, null);
        double ionEnergyEv = plasma.ionEnergyEv();
        double ionFlux = plasma.ionFlux();
        double fluence = ionFlux * exposureTime;

        // 3. D1 / D2
        double D1;
        double D2;

        if (!isAlloy) {
            D1 = atom.getPackingFactor1() != null ? atom.getPackingFactor1() : 1e-18;
            D2 = atom.getPackingFactor2() != null ? atom.getPackingFactor2() : 1e-19;
        } else {
            D1 = 0.0;
            D2 = 0.0;

            for (AlloyComponent c : alloy.getComponents()) {
                AtomList a = c.getAtom();
                double x = c.getFraction();

                double d1 = a.getPackingFactor1() != null ? a.getPackingFactor1() : 1e-18;
                double d2 = a.getPackingFactor2() != null ? a.getPackingFactor2() : 1e-19;

                D1 += x * d1;
                D2 += x * d2;
            }
        }

        // 4. Activation energy
        double Q1;
        double Q2;

        if (!isAlloy) {
            Q1 = getActivationEnergy(atom, true);
            Q2 = getActivationEnergy(atom, false);
        } else {
            Q1 = 0.0;
            Q2 = 0.0;

            for (AlloyComponent c : alloy.getComponents()) {
                AtomList a = c.getAtom();
                double x = c.getFraction();

                Q1 += x * getActivationEnergy(a, true);
                Q2 += x * getActivationEnergy(a, false);
            }
        }

        // 5. Potential
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

        // 6. Energy activation modification
        double Veff = stiffness * re;
        double Q1_mod = Q1 + ALPHA * Veff;
        double Q2_mod = Q2 + ALPHA * Veff;

        // 7. Thermal diffusion
        double term1 = D1 * Math.exp(-Q1_mod / (R * finalT));
        double term2 = D2 * Math.exp(-Q2_mod / (R * finalT));

        double D_thermal = clamp((term1 + term2) * Math.exp(-BETA * stiffness));

        // 8. Collision
        double Esurf = plasmaConfig.getSurfaceBindingEnergy() != null
                ? plasmaConfig.getSurfaceBindingEnergy()
                : 3.0;

        double impactParam = re * DEFAULT_IMPACT_PARAMETER_FACTOR;

        AtomList collisionAtom = isAlloy ? alloy.getComponents().get(0).getAtom() : atom;

        CollisionResult collision = collisionService.simulate(
                ion, collisionAtom, ionEnergyEv, impactParam, Esurf
        );

        double transferredJ = collision.transferredEnergy() * EV;
        double ionEnergyJ = ionEnergyEv * EV;

        double E_total = Math.max(transferredJ + ionEnergyJ, 0.0);

        double exponent = Math.min(E_total / (RADIATION_FACTOR * KB * finalT), 20.0);

        double D_collision = clamp(D_thermal * Math.exp(exponent));

        // 9. SLR
        double thetaRad = Math.toRadians(plasmaConfig.getIonIncidenceAngle());

        double slrFactor = slrService.computeFactor(fluence, thetaRad);
        slrFactor = Math.min(Math.max(slrFactor, 0.0), 10.0);

        double D_slr = clamp(D_collision * (1.0 + SLR_COUPLING * slrFactor));

        // 10. Resonance
        double xi = resonanceService.computeXi(collisionAtom, ionEnergyEv);

        double D_effective = clamp(D_slr * Math.max(1.0, Math.log1p(xi)));

        // 11. Profile
        double meanDepth = Math.sqrt(2 * D_effective * exposureTime);
        if (meanDepth < 1e-12) meanDepth = 1e-12;

        List<Double> depths = new ArrayList<>();
        List<Double> conc = new ArrayList<>();

        double dx = meanDepth * 6.0 / 199;

        for (int i = 0; i < 200; i++) {
            double x = i * dx;
            depths.add(x);
            conc.add(Math.exp(-x / meanDepth));
        }

        return new DiffusionProfile(
                D1, D2,
                Q1 / (NA * EV),
                Q2 / (NA * EV),
                D_thermal,
                D_effective,
                meanDepth,
                depths,
                conc
        );
    }

    private double clamp(double D) {
        if (Double.isNaN(D) || D < MIN_D) return MIN_D;
        return Math.min(D, MAX_D);
    }

    private double computeEffectiveStiffness(AlloyComposition alloy) {
        double result = 0.0;
        var comps = alloy.getComponents();

        for (int i = 0; i < comps.size(); i++) {
            for (int j = 0; j < comps.size(); j++) {

                double xi = comps.get(i).getFraction();
                double xj = comps.get(j).getFraction();

                AtomList ai = comps.get(i).getAtom();
                AtomList aj = comps.get(j).getAtom();

                double ki = potentialService.computePotential(ai.getA() * 1e-10, ai).stiffness();
                double kj = potentialService.computePotential(aj.getA() * 1e-10, aj).stiffness();

                result += xi * xj * Math.sqrt(ki * kj);
            }
        }
        return result;
    }

    private double computeEffectiveRe(AlloyComposition alloy) {
        double result = 0.0;
        var comps = alloy.getComponents();

        for (int i = 0; i < comps.size(); i++) {
            for (int j = 0; j < comps.size(); j++) {

                double xi = comps.get(i).getFraction();
                double xj = comps.get(j).getFraction();

                AtomList ai = comps.get(i).getAtom();
                AtomList aj = comps.get(j).getAtom();

                double rei = potentialService.computePotential(ai.getA() * 1e-10, ai).re();
                double rej = potentialService.computePotential(aj.getA() * 1e-10, aj).re();

                result += xi * xj * ((rei + rej) / 2.0);
            }
        }
        return result;
    }

    private double getActivationEnergy(AtomList atom, boolean first) {
        Double cohEv = first ? atom.getCohesiveEnergyEv1() : atom.getCohesiveEnergyEv2();
        if (cohEv == null) cohEv = 4.3;

        double fraction = first ? 0.25 : 0.45;

        return cohEv * EV * NA * fraction;
    }

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
            return cfg.getTargetTemperature() != null ? cfg.getTargetTemperature() : ambientTemp;
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
            return null;
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
    }
}