package plasmaApi.project.plasmaApi.service.logik;

import plasmaApi.project.plasmaApi.model.res.Config;

import java.util.List;

public interface ConfigService extends MotherService<Config, Integer>{
    List<Config> findByUser(Integer userId);
}
