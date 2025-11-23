package plasmapi.project.plasma.dto.mathDto.lattice;

import plasmapi.project.plasma.model.atom.StructureType;

public record AtomDto(
        double x,
        double y,
        double z,
        double vx,
        double vy,
        double vz,
        double a,
        StructureType structure
) {
}
