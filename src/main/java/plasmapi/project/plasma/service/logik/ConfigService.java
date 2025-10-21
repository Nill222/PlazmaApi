package plasmapi.project.plasma.service.logik;

import plasmapi.project.plasma.model.res.Config;

import java.util.List;

public interface ConfigService extends MotherService<Config, Integer>{
    List<Config> findByUser(Integer userId);
}
