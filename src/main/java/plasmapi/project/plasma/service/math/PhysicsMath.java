package plasmapi.project.plasma.service.math;

/**
 * Нормализация физических величин для расчётов, БД и JSON (без NaN/Infinity).
 */
public final class PhysicsMath {

    private PhysicsMath() {
    }

    public static final double MIN_ION_MASS_KG = 1e-30;
    public static final int MIN_ION_CHARGE = 1;
    public static final double MIN_ION_VELOCITY = 1e-6;

    public static final double MAX_ION_FLUX = 1e25;
    public static final double MAX_FLUENCE = 1e30;
    public static final double MAX_ELECTRON_DENSITY = 1e26;
    public static final double MAX_DEPTH_M = 1.0;
    public static final double MAX_DAMAGE = 1e35;
    public static final double MAX_ENERGY_J = 1e20;
    public static final double MAX_MOMENTUM = 1e15;
    public static final double MAX_DISPLACEMENT = 1.0;
    public static final double MAX_EXPOSURE_RATE = 1e25;
    public static final double MAX_STRAGGLE = 1.0;

    public static double finiteOrZero(double value) {
        return Double.isFinite(value) ? value : 0.0;
    }

    public static double finiteOrDefault(double value, double fallback) {
        return Double.isFinite(value) ? value : fallback;
    }

    public static double clampMagnitude(double value, double maxAbs) {
        if (!Double.isFinite(value)) {
            return 0.0;
        }
        if (maxAbs <= 0) {
            return value;
        }
        return Math.max(-maxAbs, Math.min(maxAbs, value));
    }

    public static double clampPositive(double value, double max) {
        if (!Double.isFinite(value) || value <= 0) {
            return 0.0;
        }
        return Math.min(value, max);
    }

    public static double sanitizeIonFlux(double ionFlux) {
        return clampPositive(ionFlux, MAX_ION_FLUX);
    }

    public static double sanitizeFluence(double fluence) {
        return clampPositive(fluence, MAX_FLUENCE);
    }

    public static double sanitizeElectronDensity(double density) {
        return clampPositive(density, MAX_ELECTRON_DENSITY);
    }

    public static double sanitizeDepth(double depthM) {
        return clampPositive(depthM, MAX_DEPTH_M);
    }

    public static double sanitizeDamage(double damage) {
        return clampPositive(damage, MAX_DAMAGE);
    }

    public static double sanitizeEnergy(double energyJ) {
        return clampPositive(energyJ, MAX_ENERGY_J);
    }

    public static double sanitizeMomentum(double momentum) {
        return clampPositive(momentum, MAX_MOMENTUM);
    }

    public static double sanitizeDisplacement(double displacement) {
        return clampPositive(displacement, MAX_DISPLACEMENT);
    }

    public static double sanitizeExposureRate(double rate) {
        return clampPositive(rate, MAX_EXPOSURE_RATE);
    }

    public static double sanitizeStraggle(double sigma) {
        return clampPositive(sigma, MAX_STRAGGLE);
    }

    public static double safeIonMassKg(Double massKg) {
        if (massKg == null || !Double.isFinite(massKg) || massKg <= 0) {
            return MIN_ION_MASS_KG;
        }
        return Math.max(massKg, MIN_ION_MASS_KG);
    }

    public static int safeIonCharge(Integer charge) {
        if (charge == null || charge < MIN_ION_CHARGE) {
            return MIN_ION_CHARGE;
        }
        return charge;
    }
}
