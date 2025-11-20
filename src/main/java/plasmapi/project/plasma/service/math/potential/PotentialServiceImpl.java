package plasmapi.project.plasma.service.math.potential;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.atom.StructureType;
import plasmapi.project.plasma.service.math.lattice.LatticePhysics;

@Service
@RequiredArgsConstructor
public class PotentialServiceImpl implements PotentialService {

    private static final double EV = 1.602176634e-19;
    private static final double EPS0 = 8.8541878128e-12;
    private static final double E_CHARGE = 1.602176634e-19;

    @Override
    public PotentialParameters computePotentialForAtomByDistance(double r, AtomList atom) {
        StructureType st = atom != null && atom.getStructure() != null ? atom.getStructure() : StructureType.BCC;

        // convert a (Å) -> meters
        double aAng = atom != null && atom.getA() != null ? atom.getA() : 2.86;
        double aMeters = aAng * 1e-10;
        double l0 = aMeters / 2.0;

        // default interval boundaries (статья: использованы характерные доли l0)
        double r1 = 0.7 * l0;
        double r2 = 1.35 * l0;
        double r3 = 2.0 * l0;
        double r4 = 2.5 * l0;

        // material-specific params — берём из AtomList если есть, иначе эвристики
        double cohesiveEv = atom != null && atom.getCohesiveEnergyEv() != null ? atom.getCohesiveEnergyEv() : 4.3;
        double De = (atom != null && atom.getMorseDeEv() != null) ? atom.getMorseDeEv() * EV : cohesiveEv * EV;
        double aParam = (atom != null && atom.getMorseA() != null) ? atom.getMorseA() : 1.0 / (aMeters * 0.1);

        double sigma = (atom != null && atom.getLjSigma() != null) ? atom.getLjSigma() : l0 / Math.pow(2.0, 1.0/6.0);
        double epsilon = (atom != null && atom.getLjEpsilonEv() != null) ? atom.getLjEpsilonEv() * EV : cohesiveEv * EV * 0.2;

        double A_BM = (atom != null && atom.getBornMayerA() != null) ? atom.getBornMayerA() : cohesiveEv * EV * 2.0;
        double a_BM = (atom != null && atom.getBornMayerAParam() != null) ? atom.getBornMayerAParam() : 0.3 * aMeters;

        double screeningLen = (atom != null && atom.getScreeningLength() != null) ? atom.getScreeningLength() : 0.5 * l0;

        double value;
        double stiffness;
        double re = l0;

        if (r < r1) {
            // Yukawa (screened Coulomb)
            double Z = Math.max(1.0, (atom != null && atom.getValence() != null ? atom.getValence() : 1));
            value = (Z * E_CHARGE * E_CHARGE) / (4.0 * Math.PI * EPS0 * r) * Math.exp(-r / screeningLen);
            stiffness = Math.abs(value) / Math.max(1e-12, r * r);
            re = r;
        } else if (r < r2) {
            // Born-Mayer
            value = A_BM * Math.exp(-r / a_BM);
            stiffness = A_BM * Math.exp(-r / a_BM) / (a_BM * a_BM);
            re = r;
        } else if (r < r3) {
            // Morse
            double expTerm = Math.exp(-aParam * (r - re));
            value = De * Math.pow(1.0 - expTerm, 2.0);
            stiffness = 2.0 * De * aParam * aParam * Math.exp(-aParam * (r - re));
            re = re;
        } else if (r < r4) {
            // Morse * switching function
            double expTerm = Math.exp(-aParam * (r - re));
            double morseVal = De * Math.pow(1.0 - expTerm, 2.0);
            double t = (r - r3) / (r4 - r3);
            double base = 1.0 - (3.0 * t * t - 2.0 * t * t * t); // hermite
            double s = 0.1 + 0.9 * base;
            value = morseVal * s;
            stiffness = 2.0 * De * aParam * aParam * s;
            re = re;
        } else {
            value = 0.0;
            stiffness = 0.0;
            re = r;
        }

        // поправка на упаковку / структуру
        double pf = (atom != null && atom.getPackingFactor() != null) ? atom.getPackingFactor() : LatticePhysics.packingFactor(st);
        stiffness *= (1.0 + 0.2 * (pf - 0.5));

        // LJ parameters convert epsilon (J) and sigma (m)
        double ljSigma = sigma;
        double ljEpsilon = epsilon;

        return new PotentialParameters(value, stiffness, re, ljSigma, ljEpsilon);
    }
}
