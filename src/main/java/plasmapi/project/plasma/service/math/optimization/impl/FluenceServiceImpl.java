package plasmapi.project.plasma.service.math.optimization.impl;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.service.math.optimization.FluenceService;

@Service
public class FluenceServiceImpl implements FluenceService {

    @Override
    public double integrateFluxOverTime(double[] vLoc, double dt) {
        double fluence = 0.0;
        for (double v : vLoc) {
            fluence += v * dt;
        }
        return fluence;
    }
}
