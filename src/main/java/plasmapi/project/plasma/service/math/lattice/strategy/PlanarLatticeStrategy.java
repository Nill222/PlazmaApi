package plasmapi.project.plasma.service.math.lattice.strategy;

import plasmapi.project.plasma.dto.mathDto.lattice.AtomPosition;

import java.util.ArrayList;
import java.util.List;

public class PlanarLatticeStrategy implements LatticeStrategy {
    @Override
    public int getDimension() {
        return 2;
    }

    @Override
    public List<AtomPosition> generate(int count, double a) {
        List<AtomPosition> positions = new ArrayList<>();
        int n = (int) Math.ceil(Math.sqrt(count));
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if(positions.size() >= count) break;
                positions.add(new AtomPosition(i * a, j * a, 0.0, 0.0));
            }
        }
        return positions;
    }
}
