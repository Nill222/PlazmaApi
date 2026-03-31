package plasmapi.project.plasma.service.math.alloy;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.service.math.diffusion.AlloyComponent;
import plasmapi.project.plasma.service.math.diffusion.AlloyComposition;
import plasmapi.project.plasma.service.math.potential.PotentialService;

@Service
@RequiredArgsConstructor
public class AlloyPotentialService {

    private final PotentialService potentialService;

    public PotentialParameters compute(double r, AlloyComposition alloy, AtomList fallback) {

        // fallback — старый режим
        if (alloy == null || alloy.getComponents() == null || alloy.getComponents().isEmpty()) {
            return potentialService.computePotential(r, fallback);
        }

        double value = 0.0;
        double stiffness = 0.0;
        double re = 0.0;

        var comps = alloy.getComponents();

        for (AlloyComponent c : comps) {

            PotentialParameters p = potentialService.computePotential(r, c.getAtom());

            value += c.getFraction() * p.value();

            // ✔ сохраняем линейную часть
            re += c.getFraction() * p.re();
        }

        // ✔ stiffness через pair-average (ВАЖНО)
        for (int i = 0; i < comps.size(); i++) {
            for (int j = 0; j < comps.size(); j++) {

                PotentialParameters pi = potentialService.computePotential(r, comps.get(i).getAtom());
                PotentialParameters pj = potentialService.computePotential(r, comps.get(j).getAtom());

                double xi = comps.get(i).getFraction();
                double xj = comps.get(j).getFraction();

                double kij = Math.sqrt(pi.stiffness() * pj.stiffness());

                stiffness += xi * xj * kij;
            }
        }

        return new PotentialParameters(value, stiffness, re, 0.0, 0.0);
    }
}