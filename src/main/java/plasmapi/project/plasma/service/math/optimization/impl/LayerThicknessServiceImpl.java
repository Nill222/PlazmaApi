package plasmapi.project.plasma.service.math.optimization.impl;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.service.math.optimization.LayerThicknessService;

@Service
public class LayerThicknessServiceImpl implements LayerThicknessService {

    @Override
    public double computeThickness(double fluence, double kDose, double kTheta, double kT) {
        return kDose * fluence * kTheta * kT;
    }
}
