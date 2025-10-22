package plasmapi.project.plasma.service.math.lattice.strategy;

import plasmapi.project.plasma.dto.mathDto.lattice.AtomPosition;

import java.util.ArrayList;
import java.util.List;

public class LinearLatticeStrategy implements LatticeStrategy {

    @Override
    public int getDimension() {
        return 1;
    }

    @Override
    public List<AtomPosition> generate(int count, double a) {
        List<AtomPosition> positions = new ArrayList<AtomPosition>();
        for (int i = 0; i < count; i++) {
            positions.add(new AtomPosition(i * a, 0.0, 0.0, 0.0));
        }
        return positions;
    }
}
