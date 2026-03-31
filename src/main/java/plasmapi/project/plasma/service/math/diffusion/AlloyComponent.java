package plasmapi.project.plasma.service.math.diffusion;

import lombok.AllArgsConstructor;
import lombok.Getter;
import plasmapi.project.plasma.model.atom.AtomList;

@AllArgsConstructor
@Getter
public class AlloyComponent {
    private AtomList atom;
    private double fraction;
}