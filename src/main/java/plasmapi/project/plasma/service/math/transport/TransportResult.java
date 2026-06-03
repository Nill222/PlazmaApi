package plasmapi.project.plasma.service.math.transport;

import java.util.List;

public record TransportResult(
        double meanRange,              // Rp
        double straggle,               // σ
        List<Double> depths,           // для профиля
        double lorentzGyroradius,      // r_L, м
        double lorentzMeanDeflectionDeg // средний угол отклонения v × B, °
) {
    public TransportResult(double meanRange, double straggle, List<Double> depths) {
        this(meanRange, straggle, depths, 0.0, 0.0);
    }
}