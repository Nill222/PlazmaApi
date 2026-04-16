package plasmapi.project.plasma.service.math.transport;

import java.util.List;

public record TransportResult(
        double meanRange,     // Rp
        double straggle,      // σ
        List<Double> depths   // для профиля
) {}