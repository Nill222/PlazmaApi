package plasmapi.project.plasma.service.logik;

import plasmapi.project.plasma.dto.logikDTO.ResultDTO;
import plasmapi.project.plasma.model.res.Result;

import java.util.List;

public interface ResultService {
    List<ResultDTO> findByConfig(Integer configId);
}
