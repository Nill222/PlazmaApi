package plasmapi.project.plasma.service.math.potential;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialDto;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;

@Service
public class PotentialServiceImpl implements PotentialService {

    @Override
    public PotentialParameters computePotential(PotentialDto p) {

        validate(p);

        double r = p.r();
        double value = switch (p.type()) {
            case MORSE -> morse(r, p.De(), p.a(), p.re());
            case LENNARD_JONES -> lj(r, p.sigma(), p.epsilon());
        };

        return new PotentialParameters(
                p.type(),
                r,
                p.De(),
                p.a(),
                p.re(),
                p.sigma(),
                p.epsilon()
        );
    }

    private void validate(PotentialDto p) {
        if (p.type() == PotentialType.MORSE) {
            if (p.De() == null || p.a() == null || p.re() == null) {
                throw new IllegalArgumentException("Для MORSE требуются De, a, re");
            }
        } else if (p.type() == PotentialType.LENNARD_JONES) {
            if (p.sigma() == null || p.epsilon() == null) {
                throw new IllegalArgumentException("Для Lennard-Jones требуются sigma, epsilon");
            }
        }
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

