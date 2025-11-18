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
        if (p.r() == null || p.r() <= 0) throw new IllegalArgumentException("r > 0 required");
        if (p.structure() == null) throw new IllegalArgumentException("Structure type required");

        StructureType st = p.structure();

        double nn = LatticePhysics.nnDistance(st, p.sigma() != null ? p.sigma() : 3e-10);

        double re = (p.re() != null) ? p.re() : nn * LatticePhysics.morseReFactor(st);
        double sigma = (p.sigma() != null) ? p.sigma() : re / Math.pow(2.0, 1.0/6.0);
        double epsilon = (p.epsilon() != null) ? p.epsilon() : 1e-21 * LatticePhysics.packingFactor(st);

        double value;
        double stiffness;

        switch (p.type()) {
            case MORSE -> {
                if (p.De() == null || p.a() == null) throw new IllegalArgumentException("Morse requires De and a");
                value = morse(p.r(), p.De(), p.a(), re);
                // second derivative at re: d2V/dr2 = 2 * De * a^2
                stiffness = 2.0 * p.De() * p.a() * p.a();
            }
            case LENNARD_JONES -> {
                value = lj(p.r(), sigma, epsilon);
                // equilibrium r0 = 2^(1/6) * sigma -> use sigma; approximate k ~ 72*epsilon/sigma^2
                stiffness = 72.0 * epsilon / (sigma * sigma);
            }
            default -> throw new IllegalArgumentException("Unknown potential type");
        }

        // scale stiffness by packing factor (denser packing -> stiffer effective medium)
        stiffness *= LatticePhysics.packingFactor(st);

        return new PotentialParameters(p.type(), p.r(), re, sigma, epsilon, value, stiffness);
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
