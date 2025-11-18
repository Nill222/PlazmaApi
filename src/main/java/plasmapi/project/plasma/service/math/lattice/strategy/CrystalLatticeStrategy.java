package plasmapi.project.plasma.service.math.lattice.strategy;

import lombok.RequiredArgsConstructor;
import plasmapi.project.plasma.dto.mathDto.lattice.AtomPosition;
import plasmapi.project.plasma.model.atom.StructureType;

import java.util.ArrayList;
import java.util.List;

/**
 * Универсальный стратегия-генератор для SC/BCC/FCC/HCP.
 * Возвращает позиции (x,y,z) в метрах (a in meters).
 */
@RequiredArgsConstructor
public class CrystalLatticeStrategy implements LatticeStrategy {

    private final StructureType structure;

    @Override
    public int getDimension() { return 3; }

    @Override
    public List<AtomPosition> generate(int count, double a) {
        // a is lattice parameter in meters (caller should convert Å -> m)
        List<double[]> basis = basisFor(structure);
        List<AtomPosition> positions = new ArrayList<>(count);

        // choose cubic supercell size n so that n^3 * basis.size() >= count
        int basisSize = basis.size();
        int n = (int) Math.ceil(Math.cbrt((double) count / basisSize));
        outer:
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                for (int k = 0; k < n; k++) {
                    for (double[] b : basis) {
                        double x = (i + b[0]) * a;
                        double y = (j + b[1]) * a;
                        double z = (k + b[2]) * a;
                        positions.add(new AtomPosition(x, y, z, 0.0, 0.0, 0.0));
                        if (positions.size() >= count) break outer;
                    }
                }
            }
        }
        return positions;
    }

    private List<double[]> basisFor(StructureType s) {
        List<double[]> b = new ArrayList<>();
        switch (s) {
            case SC -> b.add(new double[]{0.0,0.0,0.0});
            case BCC -> {
                b.add(new double[]{0.0,0.0,0.0});
                b.add(new double[]{0.5,0.5,0.5});
            }
            case FCC -> {
                b.add(new double[]{0.0,0.0,0.0});
                b.add(new double[]{0.0,0.5,0.5});
                b.add(new double[]{0.5,0.0,0.5});
                b.add(new double[]{0.5,0.5,0.0});
            }
            case HCP -> {
                // simplified HCP with hexagonal cell approximated inside cubic supercell — for demo
                // proper HCP generation requires using hexagonal lattice constants (a, c)
                b.add(new double[]{0.0,0.0,0.0});
                b.add(new double[]{2.0/3.0, 1.0/3.0, 0.5});
                b.add(new double[]{1.0/3.0, 2.0/3.0, 0.5});
                b.add(new double[]{0.0,0.0,1.0});
                b.add(new double[]{2.0/3.0, 1.0/3.0, 1.5});
                b.add(new double[]{1.0/3.0, 2.0/3.0, 1.5});
            }
        }
        return b;
    }
}

