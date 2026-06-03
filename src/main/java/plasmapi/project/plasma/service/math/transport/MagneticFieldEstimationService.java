package plasmapi.project.plasma.service.math.transport;

import plasmapi.project.plasma.model.res.PlasmaConfiguration;

/**
 * Оценка магнитного поля разряда из тока, геометрии камеры и плотности тока.
 */
public interface MagneticFieldEstimationService {

    record MagneticFieldEstimate(Vector3D field, double magnitude) {}

    MagneticFieldEstimate estimate(PlasmaConfiguration cfg, double currentDensityAm2);
}
