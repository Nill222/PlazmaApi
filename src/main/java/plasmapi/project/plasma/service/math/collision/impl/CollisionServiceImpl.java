package plasmapi.project.plasma.service.math.collision.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.service.PhysicalConstants;
import plasmapi.project.plasma.service.math.collision.CollisionService;

@Service
@RequiredArgsConstructor
public class CollisionServiceImpl implements CollisionService {

    private static final double A0 = 0.529e-10;
    private static final double EV = PhysicalConstants.EV;

    private static final double MIN_ENERGY_EV = 1e-3;
    private static final double KAPPA = 0.8;

    // ZBL universal screening
    private static final double[] C = {0.1818, 0.5099, 0.2802, 0.02817};
    private static final double[] D = {3.2, 0.9423, 0.4029, 0.2016};

    @Override
    public CollisionResult simulate(
            Ion ion,
            AtomList atom,
            double ionEnergyEv,
            double impactParameter,
            double surfaceBindingEnergyEv
    ) {

        int Z1 = Math.max(1, ion.getCharge());
        int Z2 = Math.max(1, atom.getValence());

        double M1 = Math.max(1e-30, ion.getMass());
        double M2 = Math.max(1e-30, atom.getMass());

        double mu = (M1 * M2) / (M1 + M2);

        double E_ev = Math.max(MIN_ENERGY_EV, ionEnergyEv);
        double E = E_ev * EV;

        double v = Math.sqrt(2.0 * E / M1);

        // =========================
        // 1. ZBL screening length
        // =========================
        double a = 0.8853 * A0 /
                (Math.pow(Z1, 0.23) + Math.pow(Z2, 0.23));

        // =========================
        // 2. Reduced energy ε
        // =========================
        double eps = reducedEnergy(Z1, Z2, M1, M2, E, a);

        // =========================
        // 3. Nuclear stopping
        // =========================
        double Sn = nuclearStopping(eps, Z1, Z2, M1, M2, a);

        // =========================
        // 4. Electronic stopping (улучшенный)
        // =========================
        double Se = electronicStopping(Z1, Z2, E_ev);

        // =========================
        // 5. Scattering (✔ FIXED)
        // =========================
        double theta = scatteringAngle(Z1, Z2, impactParameter, a, mu, v);

        // =========================
        // 6. Energy transfer
        // =========================
        double gamma = 4 * M1 * M2 / Math.pow(M1 + M2, 2);
        double Tmax = gamma * E;

        double transferred = Tmax * Math.pow(Math.sin(theta / 2.0), 2);
        transferred = Math.min(transferred, Tmax); // защита

        // =========================
        // 7. Damage (NRT-like)
        // =========================
        double Ed = Math.max(surfaceBindingEnergyEv, 1.0) * EV;

        double defects = 0.0;

        if (transferred > Ed) {
            double damageEnergy = KAPPA * transferred;
            defects = damageEnergy / (2.0 * Ed);
        }

        return CollisionResult.builder()
                .transferredEnergy(transferred / EV)
                .nuclearStopping(Sn)
                .electronicStopping(Se)
                .thetaCM(theta)
                .defectCount(defects)
                .impactParameter(impactParameter)
                .build();
    }

    // =========================
    // REDUCED ENERGY ε
    // =========================
    private double reducedEnergy(int Z1, int Z2, double M1, double M2, double E, double a) {

        double e2 = PhysicalConstants.E_CHARGE_SQ /
                (4.0 * Math.PI * PhysicalConstants.EPS0);

        double E0 = (Z1 * Z2 * e2) / a;

        double massFactor = M2 / (M1 + M2);

        return Math.max((E / Math.max(E0, 1e-30)) * massFactor, 1e-12);
    }

    // =========================
    // NUCLEAR STOPPING (ZBL)
    // =========================
    private double nuclearStopping(double eps, int Z1, int Z2, double M1, double M2, double a) {

        double g;

        if (eps < 1e-6) {
            g = Math.sqrt(eps);
        } else {
            g = Math.log(1 + 1.138 * eps) /
                    (eps + 0.01321 * Math.pow(eps, 0.21226)
                            + 0.19593 * Math.sqrt(eps));
        }

        double e2 = PhysicalConstants.E_CHARGE_SQ /
                (4.0 * Math.PI * PhysicalConstants.EPS0);

        return (4 * Math.PI * a * a)
                * Math.pow(Z1 * Z2 * e2, 2)
                * (M1 * M2 / Math.pow(M1 + M2, 2))
                * g;
    }

    // =========================
    // ELECTRONIC STOPPING (Lindhard-Scharff)
    // =========================
    private double electronicStopping(int Z1, int Z2, double E_ev) {

        double k = 0.0793;

        double Se = k * Math.pow(Z1, 2.0 / 3.0)
                * Math.sqrt(Z2)
                * Math.sqrt(Math.max(E_ev, 1e-6));

        return Se * 1e-20;
    }

    // =========================
    // SCATTERING (ключевой фикс)
    // =========================
    private double scatteringAngle(int Z1, int Z2, double b, double a, double mu, double v) {

        double e2 = PhysicalConstants.E_CHARGE_SQ /
                (4.0 * Math.PI * PhysicalConstants.EPS0);

        double phi = zblPhi(b / a);

        double numerator = Z1 * Z2 * e2 * phi;
        double denominator = mu * v * v * Math.max(b, 1e-12);

        return 2.0 * Math.atan(numerator / denominator);
    }

    // =========================
    // ZBL screening
    // =========================
    private double zblPhi(double x) {

        double phi = 0.0;

        for (int i = 0; i < C.length; i++) {
            phi += C[i] * Math.exp(-D[i] * x);
        }

        return phi;
    }
}