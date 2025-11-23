package plasmapi.project.plasma.service.math.lattice;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.atom.AtomListDto;
import plasmapi.project.plasma.dto.mathDto.lattice.AtomDto;
import plasmapi.project.plasma.dto.mathDto.lattice.AtomPosition;
import plasmapi.project.plasma.model.atom.StructureType;
import plasmapi.project.plasma.service.math.lattice.strategy.CrystalLatticeStrategy;
import plasmapi.project.plasma.service.math.lattice.strategy.LatticeStrategy;
import plasmapi.project.plasma.service.math.simulation.SimulationService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LatticeServiceImpl implements LatticeService {

    private final SimulationService simulationService;

    @Override
    public List<AtomDto> generateLattice(Integer atomListId, int count) {
        AtomListDto atom = simulationService.getAtomList(atomListId);
        if (atom == null) throw new IllegalArgumentException("AtomList not found");

        double a = atom.A() != null ? atom.A() * 1e-10 : 2.86e-10; // fallback
        StructureType structure = atom.structure() != null ? atom.structure() : StructureType.BCC;

        LatticeStrategy strategy = new CrystalLatticeStrategy(structure);
        List<AtomPosition> positions = strategy.generate(count, a);

        return positions.stream().map(pos -> new AtomDto(
                pos.x(), pos.y(), pos.z(),
                pos.vx(), pos.vy(), pos.vz(),
                a, structure
        )).toList();
    }
}
