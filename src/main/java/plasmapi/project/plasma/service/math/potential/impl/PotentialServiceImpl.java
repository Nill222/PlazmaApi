package plasmapi.project.plasma.service.math.potential.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.atom.StructureType;
import plasmapi.project.plasma.service.PhysicalConstants;
import plasmapi.project.plasma.service.math.potential.PotentialService;
import plasmapi.project.plasma.service.math.lattice.LatticePhysics;

@Service
@RequiredArgsConstructor
public class PotentialServiceImpl implements PotentialService {

    private static final double ZBL_A0 = 0.4685e-10;
    private static final double[] ZBL_COEFF = {0.1818, 0.5099, 0.2802, 0.02817};
    private static final double[] ZBL_EXP = {3.2, 0.9423, 0.4029, 0.2016};

    // =========================
    // SINGLE ATOM (compatibility)
    // =========================
    @Override
    public PotentialParameters computePotential(double r, AtomList atom) {

        return computeBinaryPotential(r, atom, atom);
    }

    // =========================
    // BINARY POTENTIAL (🔥 alloy-aware core)
    // =========================
    public PotentialParameters computeBinaryPotential(double r, AtomList a1, AtomList a2) {

        double aMeters1 = a1.getA() * 1e-10;
        double aMeters2 = a2.getA() * 1e-10;

        StructureType structure = a1.getStructure();

        double re0 = equilibriumDistance((aMeters1 + aMeters2) / 2.0, structure);

        double De = averageDe(a1, a2);

        // ✅ корректный alpha
        double alpha = averageAlpha(a1, a2, re0);

        // ✅ атомные номера
        int Z1 = a1.getAtomNumber() != null ? a1.getAtomNumber() : a1.getValence();
        int Z2 = a2.getAtomNumber() != null ? a2.getAtomNumber() : a2.getValence();

        double r1 = 0.7 * re0;
        double r2 = 1.35 * re0;
        double r3 = 2.0 * re0;
        double r4 = 2.5 * re0;

        double value;
        double stiffness;

        if (r < r1) {

            value = zblPotential(r, Z1, Z2);
            stiffness = secondDerivativeZBL(r, Z1, Z2);

        } else if (r < r2) {

            double A_BM = 2 * De;
            double a_BM = 0.3 * ((aMeters1 + aMeters2) / 2.0);

            value = A_BM * Math.exp(-r / a_BM);
            stiffness = value / (a_BM * a_BM);

        } else if (r < r3) {

            double exp1 = Math.exp(-alpha * (r - re0));
            double exp2 = exp1 * exp1;

            value = De * (exp2 - 2.0 * exp1);
            stiffness = 2.0 * De * alpha * alpha * (2.0 * exp2 - exp1);

        } else if (r < r4) {

            double exp1 = Math.exp(-alpha * (r - re0));
            double exp2 = exp1 * exp1;

            double morse = De * (exp2 - 2.0 * exp1);
            double morseStiffness = 2.0 * De * alpha * alpha * (2.0 * exp2 - exp1);

            double t = (r - r3) / (r4 - r3);

            double H = 1 - 3 * t * t + 2 * t * t * t;
            double S = 0.1 + 0.9 * H;

            value = morse * S;

            double dS = (-6 * t + 6 * t * t) / (r4 - r3);

            stiffness = morseStiffness * S + Math.abs(morse) * dS * dS;

        } else {
            value = 0.0;
            stiffness = 0.0;
        }

        double sigma = re0 / Math.pow(2, 1.0 / 6);
        double epsilon = 0.2 * De;

        return new PotentialParameters(value, stiffness, r, sigma, epsilon);
    }
    /**
     * ZBL потенциал для двух разных атомов
     */
    private double zblPotential(double r, int Z1, int Z2) {

        double a = ZBL_A0 / (Math.pow(Z1, 0.23) + Math.pow(Z2, 0.23));

        double phi = zblUniversalPhi(r / a);

        return (Z1 * Z2 * PhysicalConstants.E_CHARGE_SQ) /
                (4 * Math.PI * PhysicalConstants.EPS0 * r) * phi;
    }

    /**
     * Численная вторая производная ZBL (реальная жёсткость)
     */
    private double secondDerivativeZBL(double r, int Z1, int Z2) {

        double dr = Math.max(r * 1e-4, 1e-12);

        double v1 = zblPotential(r - dr, Z1, Z2);
        double v2 = zblPotential(r, Z1, Z2);
        double v3 = zblPotential(r + dr, Z1, Z2);

        return (v1 - 2.0 * v2 + v3) / (dr * dr);
    }

    /**
     * Эквивалентная глубина потенциальной ямы
     */
    private double averageDe(AtomList a1, AtomList a2) {

        double d1 = a1.getCohesiveEnergyEv1() != null
                ? a1.getCohesiveEnergyEv1()
                : 4.3;

        double d2 = a2.getCohesiveEnergyEv1() != null
                ? a2.getCohesiveEnergyEv1()
                : 4.3;

        return ((d1 + d2) / 2.0) * PhysicalConstants.EV;
    }

    /**
     * alpha (крутизна потенциала)
     */
    private double averageAlpha(AtomList a1, AtomList a2, double re0) {

        Double alpha1 = a1.getA();
        Double alpha2 = a2.getA();

        if (alpha1 != null && alpha2 != null) {
            return (alpha1 + alpha2) / 2.0;
        }

        return 3.0 / re0;
    }

    /**
     * Экранирование ZBL
     */
    private double zblUniversalPhi(double x) {

        double phi = 0.0;

        for (int i = 0; i < ZBL_COEFF.length; i++) {
            phi += ZBL_COEFF[i] * Math.exp(-ZBL_EXP[i] * x);
        }

        return phi;
    }

    /**
     * Равновесное расстояние
     */
    private double equilibriumDistance(double a, StructureType structure) {

        return switch (structure) {
            case FCC -> a / Math.sqrt(2);
            case BCC -> a * Math.sqrt(3) / 2;
            case SC -> a;
            case HCP -> a;
            default -> a * LatticePhysics.morseReFactor(structure);
        };
    }
}