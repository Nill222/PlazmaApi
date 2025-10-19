package plasmaApi.project.plasmaApi.service.math.Lattice;

import org.springframework.stereotype.Service;
import plasmaApi.project.plasmaApi.dto.mathDto.lattice.AtomDto;
import plasmaApi.project.plasmaApi.dto.mathDto.lattice.AtomPosition;
import plasmaApi.project.plasmaApi.dto.mathDto.lattice.LatticeGenerationRequest;
import plasmaApi.project.plasmaApi.mapper.AtomMapper;
import plasmaApi.project.plasmaApi.model.atom.Atom;
import plasmaApi.project.plasmaApi.model.atom.AtomList;
import plasmaApi.project.plasmaApi.model.res.Config;
import plasmaApi.project.plasmaApi.repository.AtomListRepository;
import plasmaApi.project.plasmaApi.repository.AtomRepository;
import plasmaApi.project.plasmaApi.repository.ConfigRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LatticeServiceImpl implements LatticeService {

    private final AtomRepository atomRepository;
    private final AtomListRepository atomListRepository;
    private final ConfigRepository configRepository;
    private final Map<Integer, LatticeStrategy> strategies;
    private final AtomMapper atomMapper;

    public LatticeServiceImpl(AtomRepository atomRepository,
                          AtomListRepository atomListRepository,
                          ConfigRepository configRepository,
                          List<LatticeStrategy> strategyList,
                          AtomMapper atomMapper) {
        this.atomRepository = atomRepository;
        this.atomListRepository = atomListRepository;
        this.configRepository = configRepository;
        this.atomMapper = atomMapper;

        // мы создаём карту dimension → стратегия
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(LatticeStrategy::getDimension, s -> s));
    }

    public List<AtomDto> generateLattice(LatticeGenerationRequest request) {
        Config config = configRepository.findById(request.configId())
                .orElseThrow(() -> new IllegalArgumentException("Config not found"));

        AtomList atomType = atomListRepository.findById(request.atomListId())
                .orElseThrow(() -> new IllegalArgumentException("Atom type not found"));

        double a = atomType.getA() * 1e-10;

        LatticeStrategy strategy = strategies.get(request.dimension());
        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported dimension: " + request.dimension());
        }

        List<AtomPosition> positions = strategy.generate(request.count(), a);

        List<Atom> atoms = positions.stream().map(pos -> {
            Atom atom = new Atom();
            atom.setConfig(config);
            atom.setAtomList(atomType);
            atom.setX(pos.x());
            atom.setY(pos.y());
            atom.setVx(pos.vx());
            atom.setVy(pos.vy());
            return atom;
        }).toList();

        return atomRepository.saveAll(atoms).stream()
                .map(atomMapper::toDo)
                .toList();
    }
}
