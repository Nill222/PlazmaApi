package plasmaApi.project.plasmaApi.service.math.Lattice;

import plasmaApi.project.plasmaApi.dto.mathDto.lattice.AtomDto;
import plasmaApi.project.plasmaApi.dto.mathDto.lattice.LatticeGenerationRequest;

import java.util.List;

public interface LatticeService {
    List<AtomDto> generateLattice(LatticeGenerationRequest request);
}
