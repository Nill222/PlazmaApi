package plasmaApi.project.plasmaApi.service.math.Lattice;

import plasmaApi.project.plasmaApi.dto.mathDto.lattice.AtomPosition;

import java.util.List;

public interface LatticeStrategy {
    int getDimension();
    List<AtomPosition> generate(int count, double a);
}
