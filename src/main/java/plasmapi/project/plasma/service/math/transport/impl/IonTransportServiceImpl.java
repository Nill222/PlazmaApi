package plasmapi.project.plasma.service.math.transport.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.service.PhysicalConstants;
import plasmapi.project.plasma.service.math.collision.CollisionService;
import plasmapi.project.plasma.service.math.transport.IonTransportService;
import plasmapi.project.plasma.service.math.transport.TransportResult;
import plasmapi.project.plasma.service.math.transport.Vector3D;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IonTransportServiceImpl implements IonTransportService {

    private final CollisionService collisionService;

    private static final double EV = PhysicalConstants.EV;
    private static final double E_MIN = 1.0; // eV

    @Override
    public TransportResult simulate(
            Ion ion,
            AtomList atom,
            double ionEnergyEv,
            int particles
    ) {

        List<Double> ranges = new ArrayList<>();

        for (int i = 0; i < particles; i++) {
            double depth = simulatePrimaryIon(
                    ion,
                    atom,
                    ionEnergyEv * EV
            );
            ranges.add(depth);
        }

        double mean = ranges.stream().mapToDouble(d -> d).average().orElse(0.0);

        double variance = ranges.stream()
                .mapToDouble(d -> (d - mean) * (d - mean))
                .average()
                .orElse(0.0);

        double sigma = Math.sqrt(variance);

        return new TransportResult(mean, sigma, ranges);
    }

    // =========================================
    // PRIMARY ION TRANSPORT (3D)
    // =========================================
    private double simulatePrimaryIon(Ion ion, AtomList atom, double E) {

        Vector3D dir = new Vector3D(0, 0, 1);
        double depth = 0.0;

        double density = computeAtomicDensity(atom);

        int Z1 = Math.max(1, ion.getCharge());
        int Z2 = Math.max(1, atom.getValence());

        double M1 = ion.getMass();
        double M2 = atom.getMass();

        double a = 0.8853 * 0.529e-10 /
                (Math.pow(Z1, 0.23) + Math.pow(Z2, 0.23));

        while (E > E_MIN * EV) {

            // =========================
            // 1. cross section
            // =========================
            double sigma = computeCrossSection(Z1, Z2, M1, M2, E, a);
            if (sigma <= 0) break;

            double lambda = 1.0 / (density * sigma);
            double step = -lambda * Math.log(Math.random());

            // ограничение шага (стабильность)
            step = Math.min(step, 5e-9);

            double bMax = Math.sqrt(sigma / Math.PI);
            double b = bMax * Math.sqrt(Math.random());

            // =========================
            // 2. collision
            // =========================
            CollisionResult col = collisionService.simulate(
                    ion,
                    atom,
                    E / EV,
                    b,
                    25.0
            );

            double thetaCM = col.thetaCM();

            // =========================
            // 3. CM → LAB
            // =========================
            double denom = Math.cos(thetaCM) + M1 / M2;
            denom = Math.max(denom, 1e-12);

            double thetaLab = Math.atan(Math.sin(thetaCM) / denom);
            double phi = 2 * Math.PI * Math.random();

            dir = rotate(dir, thetaLab, phi);

            // =========================
            // 4. stopping (✔ FIXED)
            // =========================
            double Sn = col.nuclearStopping() * density;
            double Se = col.electronicStopping() * density;

            double dE = (Sn + Se) * step;

            E -= dE;

            if (E <= 0) break;

            // =========================
            // 5. depth
            // =========================
            if (dir.getZ() > 0) {
                depth += step * dir.getZ();
            }

            // =========================
            // 6. cascade
            // =========================
            double T = col.transferredEnergy() * EV;

            if (T > 25.0 * EV) {

                double recoilEnergy = 0.5 * T;

                Ion recoil = new Ion();
                recoil.setMass(M2);
                recoil.setCharge(Z2);

                simulateCascade(recoil, atom, recoilEnergy, 1);
            }

            // =========================
            // 7. выход из материала
            // =========================
            if (dir.getZ() < 0 && depth <= 0) {
                break;
            }
        }

        return Math.max(depth, 0.0);
    }
    // =========================================
    // CASCADE (не влияет на глубину)
    // =========================================
    private void simulateCascade(Ion ion, AtomList atom, double E, int depth) {

        if (E < 5 * EV || depth > 10) return;

        int Z1 = Math.max(1, ion.getCharge());
        int Z2 = Math.max(1, atom.getValence());

        double M1 = ion.getMass();
        double M2 = atom.getMass();

        double density = computeAtomicDensity(atom);

        double a = 0.8853 * 0.529e-10 /
                (Math.pow(Z1, 0.23) + Math.pow(Z2, 0.23));

        while (E > E_MIN * EV) {

            double sigma = computeCrossSection(Z1, Z2, M1, M2, E, a);
            if (sigma <= 0) break;

            double lambda = 1.0 / (density * sigma);
            double step = -lambda * Math.log(Math.random());

            step = Math.min(step, 5e-9);

            double bMax = Math.sqrt(sigma / Math.PI);
            double b = bMax * Math.sqrt(Math.random());

            CollisionResult col = collisionService.simulate(
                    ion,
                    atom,
                    E / EV,
                    b,
                    25.0
            );

            // stopping (✔ FIXED)
            double Sn = col.nuclearStopping() * density;
            double Se = col.electronicStopping() * density;

            double dE = (Sn + Se) * step;

            E -= dE;

            if (E <= 0) break;

            // каскад дальше
            double T = col.transferredEnergy() * EV;

            if (T > 25.0 * EV) {

                double recoilEnergy = 0.5 * T;

                Ion recoil = new Ion();
                recoil.setMass(M2);
                recoil.setCharge(Z2);

                simulateCascade(recoil, atom, recoilEnergy, depth + 1);
            }
        }
    }

    // =========================================
    // REDUCED ENERGY (единый с collision)
    // =========================================
    private double reducedEnergy(int Z1, int Z2, double M1, double M2, double E, double a) {

        double e2 = PhysicalConstants.E_CHARGE_SQ /
                (4.0 * Math.PI * PhysicalConstants.EPS0);

        double E0 = (Z1 * Z2 * e2) / a;

        double massFactor = M2 / (M1 + M2);

        return Math.max((E / Math.max(E0, 1e-30)) * massFactor, 1e-12);
    }

    // =========================================
    // CROSS SECTION (✔ согласован с ZBL)
    // =========================================
    private double computeCrossSection(int Z1, int Z2, double M1, double M2, double E, double a) {

        double eps = reducedEnergy(Z1, Z2, M1, M2, E, a);

        double sigma0 = Math.PI * a * a;

        double f;

        if (eps < 1e-6) {
            f = Math.sqrt(eps);
        } else {
            f = Math.log(1 + 1.138 * eps) /
                    (eps + 0.01321 * Math.pow(eps, 0.21226)
                            + 0.19593 * Math.sqrt(eps));
        }

        return Math.max(sigma0 * f, 1e-22);
    }

    // =========================================
    // ATOMIC DENSITY
    // =========================================
    private double computeAtomicDensity(AtomList atom) {

        double rho = atom.getDsteny();
        double M = atom.getMolarMass();

        if (rho <= 0 || M <= 0) {
            return 1e28;
        }

        return rho * PhysicalConstants.NA / M;
    }

    // =========================================
    // ROTATION (3D scattering)
    // =========================================
    private Vector3D rotate(Vector3D dir, double theta, double phi) {

        double ux = dir.getX();
        double uy = dir.getY();
        double uz = dir.getZ();

        double sinT = Math.sin(theta);
        double cosT = Math.cos(theta);

        double sinP = Math.sin(phi);
        double cosP = Math.cos(phi);

        double sqrt = Math.sqrt(Math.max(1 - uz * uz, 0.0));

        double newX, newY, newZ;

        if (sqrt > 1e-10) {
            newX = ux * cosT + (ux * uz * cosP - uy * sinP) * sinT / sqrt;
            newY = uy * cosT + (uy * uz * cosP + ux * sinP) * sinT / sqrt;
            newZ = uz * cosT - sqrt * cosP * sinT;
        } else {
            // почти вертикальное движение
            newX = sinT * cosP;
            newY = sinT * sinP;
            newZ = Math.signum(uz) * cosT;
        }

        return new Vector3D(newX, newY, newZ).normalize();
    }
}