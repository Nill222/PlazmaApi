package plasmapi.project.plasma.service.math.potential;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialDto;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.StructureType;
import plasmapi.project.plasma.service.math.lattice.LatticePhysics;

@Service
@RequiredArgsConstructor
public class PotentialServiceImpl implements PotentialService {

    @Override
    public PotentialParameters computePotential(PotentialDto p) {
        // validate inside dto (annotations) + extra runtime checks
        if (p.r() <= 0) throw new IllegalArgumentException("r must be > 0");

        StructureType ls = p.structure(); // предполагаем, что PotentialDto содержит structure
        double a = p.sigma(); // if provided base lattice parameter in meters or from atomList

        // compute re and sigma, epsilon by combining dto values (if provided) or auto from lattice
        double re = p.De() != null && p.re() != null ? p.re() : LatticePhysics.nnDistance(ls, a) * LatticePhysics.potentialReFactor(ls);
        double sigma = p.sigma() != null ? p.sigma() : re * 0.9;
        double epsilon = p.epsilon() != null ? p.epsilon() : Math.max(1e-21, p.epsilon() * LatticePhysics.packingFactor(ls));

        double value = switch (p.type()) {
            case MORSE -> {
                if (p.De() == null || p.a() == null) throw new IllegalArgumentException("Morse requires De and a");
                yield morse(p.r(), p.De(), p.a(), re);
            }
            case LENNARD_JONES -> {
                yield lj(p.r(), sigma, epsilon);
            }
            default -> throw new IllegalArgumentException("Unknown potential type");
        };

        return new PotentialParameters(p.type(), p.r(), re, sigma, epsilon, value);
    }

    private double morse(double r, double De, double a, double re) {
        double exp = Math.exp(-a * (r - re));
        return De * Math.pow(1 - exp, 2);
    }

    private double lj(double r, double sigma, double epsilon) {
        double sr = sigma / r;
        double sr6 = Math.pow(sr, 6);
        double sr12 = Math.pow(sr, 12);
        return 4 * epsilon * (sr12 - sr6);
    }
}
