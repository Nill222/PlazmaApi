package plasmapi.project.plasma.service.math.slr;

import plasmapi.project.plasma.dto.mathDto.slr.SLRResultDto;

public interface SLRService {
    SLRResultDto computeSLR(double[][] field, double slrParam, double theta, double fluence);
}
