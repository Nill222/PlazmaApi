package plasmapi.project.plasma.service.math.potential;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.atom.AtomListDto;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParametersDto;
import plasmapi.project.plasma.model.atom.StructureType;
import plasmapi.project.plasma.service.math.lattice.LatticePhysics;
import plasmapi.project.plasma.service.math.simulation.SimulationService;

@Service
@RequiredArgsConstructor
public class PotentialServiceImpl implements PotentialService {

    private final SimulationService simulationService;

    private static final double EV = 1.602176634e-19;
    private static final double EPS0 = 8.8541878128e-12;
    private static final double E_CHARGE = 1.602176634e-19;

    @Override
    public PotentialParametersDto computePotential(double r, Integer atomListId) {
        AtomListDto atom = simulationService.getAtomList(atomListId);
        if (atom == null) throw new IllegalArgumentException("AtomList required");

        StructureType structure = atom.structure() != null ? atom.structure() : StructureType.BCC;
        double aMeters = atom.A() != null ? atom.A() * 1e-10 : 2.86e-10;

        double re0 = aMeters * LatticePhysics.morseReFactor(structure);

        double r1 = 0.7 * re0;
        double r2 = 1.35 * re0;
        double r3 = 2.0 * re0;
        double r4 = 2.5 * re0;

        double EV = 1.602176634e-19;
        double De = atom.cohesiveEnergyEv1() != null ? atom.cohesiveEnergyEv1() * EV : 4.3 * EV;
        double aParam = 1.0 / (0.1 * aMeters);
        double A_BM = 2 * De;
        double a_BM = 0.3 * aMeters;
        double sigma = re0 / Math.pow(2, 1.0 / 6.0);
        double epsilon = 0.2 * De;
        double Z = atom.valence() != null ? atom.valence() : 1;
        double screening = atom.screeningLength() != null ? atom.screeningLength() : 0.5 * re0;

        double value = 0, stiffness = 0;

        if (r < r1) {
            value = (Z * EV * EV) / (4 * Math.PI * 8.8541878128e-12 * r) * Math.exp(-r / screening);
            stiffness = Math.abs(value) / (r * r);
        } else if (r < r2) {
            value = A_BM * Math.exp(-r / a_BM);
            stiffness = value / (a_BM * a_BM);
        } else if (r < r3) {
            double exp = Math.exp(-aParam * (r - re0));
            value = De * Math.pow(1 - exp, 2);
            stiffness = 2 * De * aParam * aParam * exp;
        } else if (r < r4) {
            double exp = Math.exp(-aParam * (r - re0));
            double morse = De * Math.pow(1 - exp, 2);
            double t = (r - r3) / (r4 - r3);
            double H = 1 - (3 * t * t - 2 * t * t * t);
            double S = 0.1 + 0.9 * H;
            value = morse * S;
            stiffness = 2 * De * aParam * aParam * S;
        }

        double pack = atom.diffusionPrefactor1() != null ? atom.diffusionPrefactor2() : LatticePhysics.packingFactor(structure);
        stiffness *= (1 + 0.2 * (pack - 0.5));

        return new PotentialParametersDto(value, stiffness, r, sigma, epsilon);
    }
}
