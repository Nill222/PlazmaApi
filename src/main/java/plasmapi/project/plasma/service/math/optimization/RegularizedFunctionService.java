package plasmapi.project.plasma.service.math.optimization;

public interface RegularizedFunctionService {
    double computeFreg(double Cuniform, double[][] thickness, double[] constraints, double[] weights);
}

