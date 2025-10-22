package plasmapi.project.plasma.service.math.lattice.strategy;

import plasmapi.project.plasma.dto.mathDto.lattice.AtomPosition;

import java.util.List;

public interface LatticeStrategy {
    int getDimension();
    List<AtomPosition> generate(int count, double a);
}
