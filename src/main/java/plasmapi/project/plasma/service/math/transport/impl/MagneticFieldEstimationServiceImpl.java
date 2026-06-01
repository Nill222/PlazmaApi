package plasmapi.project.plasma.service.math.transport.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.math.transport.MagneticFieldEstimationService;
import plasmapi.project.plasma.service.math.transport.Vector3D;

/**
 * B из закона Ампера для тока разряда и геометрии камеры:
 * B_θ ≈ μ₀ I / (2πR), B_z ≈ μ₀ I / (4L) от замыкающего тока.
 */
@Service
public class MagneticFieldEstimationServiceImpl implements MagneticFieldEstimationService {

    private static final double MU0 = 4.0 * Math.PI * 1e-7;
    private static final double MIN_LENGTH = 0.01;
    private static final double MAX_FIELD_T = 1.0;

    @Value("${energy-deposition.lorentz.enabled:true}")
    private boolean enabled = true;

    @Value("${energy-deposition.lorentz.axial-current-factor:1.0}")
    private double axialCurrentFactor = 1.0;

    @Value("${energy-deposition.lorentz.return-current-axial-fraction:0.3}")
    private double returnCurrentAxialFraction = 0.3;

    @Value("${energy-deposition.lorentz.current-density-factor:0.5}")
    private double currentDensityFactor = 0.5;

    @Value("${energy-deposition.lorentz.pressure-damping-pa:50.0}")
    private double pressureDampingPa = 50.0;

    @Override
    public MagneticFieldEstimate estimate(PlasmaConfiguration cfg, double currentDensityAm2) {
        if (!enabled || cfg == null) {
            return empty();
        }

        double current = Math.abs(nz(cfg.getCurrent()));
        if (current <= 0) {
            return empty();
        }

        double width = Math.max(nz(cfg.getChamberWidth()), MIN_LENGTH);
        double depth = Math.max(nz(cfg.getChamberDepth()), MIN_LENGTH);
        double gapLength = Math.max(
                nz(cfg.getElectrodeDistance()),
                Math.max(depth, MIN_LENGTH)
        );

        double effectiveRadius = Math.max(0.5 * Math.min(width, depth), MIN_LENGTH);
        double chamberSpan = Math.max(Math.min(width, depth), MIN_LENGTH);

        // Азимутальное поле от осевого тока разряда (Biot–Savart, бесконечный проводник)
        double bTangential = MU0 * current * axialCurrentFactor / (2.0 * Math.PI * effectiveRadius);

        // Дополнительный вклад от плотности тока j = I/A (концентрация в плазменном столбе)
        double bFromCurrentDensity = MU0 * Math.abs(currentDensityAm2) * chamberSpan * currentDensityFactor;

        double pressurePa = Math.max(nz(cfg.getPressure()), 0.0);
        double pressureDamp = 1.0 / (1.0 + pressurePa / Math.max(pressureDampingPa, 1e-6));

        double bHorizontal = Math.max(bTangential, bFromCurrentDensity) * pressureDamp;
        double bAxial = MU0 * current * returnCurrentAxialFraction / (4.0 * gapLength) * pressureDamp;

        bHorizontal = Math.min(bHorizontal, MAX_FIELD_T);
        bAxial = Math.min(bAxial, MAX_FIELD_T);

        // Горизонтальное поле ⊥ оси z (типичная ориентация для магнетронного разряда)
        Vector3D field = new Vector3D(0.0, bHorizontal, bAxial);
        return new MagneticFieldEstimate(field, field.magnitude());
    }

    private static MagneticFieldEstimate empty() {
        return new MagneticFieldEstimate(Vector3D.ZERO, 0.0);
    }

    private static double nz(Double v) {
        return v != null && Double.isFinite(v) ? v : 0.0;
    }
}
