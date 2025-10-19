package plasmaApi.project.plasmaApi.service.logik;

import plasmaApi.project.plasmaApi.model.res.Result;

import java.util.List;

public interface ResultService {
    List<Result> findByConfig(Integer configId);
}
