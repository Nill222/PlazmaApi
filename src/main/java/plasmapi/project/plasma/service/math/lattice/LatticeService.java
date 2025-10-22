package plasmapi.project.plasma.service.math.lattice;

import plasmapi.project.plasma.dto.mathDto.lattice.AtomDto;
import plasmapi.project.plasma.dto.mathDto.lattice.LatticeGenerationRequest;

import java.util.List;

public interface LatticeService {
    List<AtomDto> generateLattice(LatticeGenerationRequest request);
}
