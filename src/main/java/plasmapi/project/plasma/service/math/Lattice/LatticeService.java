package plasmapi.project.plasma.service.math.Lattice;

import plasmapi.project.plasma.dto.mathDto.lattice.AtomDto;
import plasmapi.project.plasma.dto.mathDto.lattice.LatticeGenerationRequest;

import java.util.List;

public interface LatticeService {
    List<AtomDto> generateLattice(LatticeGenerationRequest request);
}
