package plasmapi.project.plasma.service.math.optimization;

public interface LayerThicknessService {
    double computeThickness(double fluence, double kDose, double kTheta, double kT);
}
