package plasmapi.project.plasma.service.math.lattice;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.lattice.AtomDto;
import plasmapi.project.plasma.dto.mathDto.lattice.AtomPosition;
import plasmapi.project.plasma.dto.mathDto.lattice.LatticeGenerationRequest;
import plasmapi.project.plasma.mapper.atom.AtomMapper;
import plasmapi.project.plasma.model.atom.Atom;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.atom.StructureType;
import plasmapi.project.plasma.model.res.Config;
import plasmapi.project.plasma.repository.AtomListRepository;
import plasmapi.project.plasma.repository.AtomRepository;
import plasmapi.project.plasma.repository.ConfigRepository;
import plasmapi.project.plasma.service.math.lattice.strategy.CrystalLatticeStrategy;
import plasmapi.project.plasma.service.math.lattice.strategy.LatticeStrategy;

import java.util.List;

@Service
public class LatticeServiceImpl implements LatticeService {

    private final AtomRepository atomRepository;
    private final AtomListRepository atomListRepository;
    private final ConfigRepository configRepository;
    private final AtomMapper atomMapper;

    public LatticeServiceImpl(
            AtomRepository atomRepository,
            AtomListRepository atomListRepository,
            ConfigRepository configRepository,
            AtomMapper atomMapper) {

        this.atomRepository = atomRepository;
        this.atomListRepository = atomListRepository;
        this.configRepository = configRepository;
        this.atomMapper = atomMapper;
    }

    @Override
    public List<AtomDto> generateLattice(LatticeGenerationRequest request) {

        Config config = configRepository.findById(request.configId())
                .orElseThrow(() -> new IllegalArgumentException("Config not found"));

        AtomList atomType = atomListRepository.findById(request.atomListId())
                .orElseThrow(() -> new IllegalArgumentException("Atom type not found"));

        double a = atomType.getA() * 1e-10;

        StructureType structure =
                atomType.getStructure() != null ? atomType.getStructure() : request.structure();

        LatticeStrategy strategy = new CrystalLatticeStrategy(structure);

        List<AtomPosition> positions = strategy.generate(request.count(), a);

        List<Atom> atoms = positions.stream().map(pos -> {
            Atom atom = new Atom();
            atom.setConfig(config);
            atom.setAtomList(atomType);
            atom.setX(pos.x());
            atom.setY(pos.y());
            atom.setZ(pos.z());
            atom.setVx(pos.vx());
            atom.setVy(pos.vy());
            atom.setVz(pos.vz());
            return atom;
        }).toList();

        return atomRepository.saveAll(atoms).stream()
                .map(atomMapper::toDo)
                .toList();
    }
}
