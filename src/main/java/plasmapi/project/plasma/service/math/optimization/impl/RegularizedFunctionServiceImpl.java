package plasmapi.project.plasma.service.math.optimization.impl;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.service.math.optimization.RegularizedFunctionService;

@Service
public class RegularizedFunctionServiceImpl implements RegularizedFunctionService {

    @Override
    public double computeFreg(double Cuniform, double[][] thickness, double[] constraints, double[] weights) {
        double penaltySum = 0.0;

        for (int i = 0; i < constraints.length; i++) {
            double maxVal = 0.0;
            for (int x = 0; x < thickness.length; x++) {
                for (int y = 0; y < thickness[0].length; y++) {
                    maxVal = Math.max(maxVal, constraints[i] - thickness[x][y]);
                }
            }
            penaltySum += weights[i] * Math.pow(Math.max(0, maxVal), 2);
        }

        return Cuniform + penaltySum;
    }
}

