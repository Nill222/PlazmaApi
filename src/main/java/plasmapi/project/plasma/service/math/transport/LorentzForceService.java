package plasmapi.project.plasma.service.math.transport;

/**
 * Сила Лоренца: F = q(E + v × B), интегрирование скорости (алгоритм Бориса).
 */
public interface LorentzForceService {

    /**
     * Сдвиг скорости за время полёта dt (с), заряд в единицах e, масса в кг.
     */
    Vector3D advanceVelocity(Vector3D velocity, LorentzContext context, int chargeUnits, double massKg, double dt);

    /**
     * Радиус циклотронной орбиты r_L = m v / (q B) при v ⊥ B.
     */
    double gyroradius(double speed, int chargeUnits, double massKg, double magneticFieldTesla);
}
