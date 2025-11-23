package plasmapi.project.plasma.service.math.resonanse;


import plasmapi.project.plasma.dto.mathDto.resonance.ResonanceInputDto;
import plasmapi.project.plasma.model.atom.AtomList;

public interface ResonanceService {
    /**
     * Возвращает резонансный множитель xi >= 1 (1 - нет усиления).
     */
    double computeXi(Integer atomListId, ResonanceInputDto in);
}

