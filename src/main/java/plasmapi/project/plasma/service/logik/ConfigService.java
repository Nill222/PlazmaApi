package plasmapi.project.plasma.service.logik;

import plasmapi.project.plasma.dto.logikDTO.config.ConfigCreateDto;
import plasmapi.project.plasma.dto.logikDTO.config.ConfigDTO;
import plasmapi.project.plasma.model.res.Config;

import java.util.List;

public interface ConfigService extends MotherService<Config, Integer, ConfigCreateDto>{
    List<ConfigDTO> findByUser(Integer userId);
}
