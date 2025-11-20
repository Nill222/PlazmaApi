package plasmapi.project.plasma.service.math.slr;

import plasmapi.project.plasma.dto.mathDto.slr.SLRResult;

public interface SLRService {
    SLRResult computeSLR(double[][] field, double slrParam);
}
