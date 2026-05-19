package plasmapi.project.plasma.service.math.energy;

/**
 * Кусочный профиль потенциала в межэлектродном зазоре (1) и напряжённость поля (14).
 */
public interface DischargePotentialService {

    /**
     * Потенциал φ(x), x ∈ [0, L] — от анода к катоду/заготовке.
     */
    double potentialAt(double x, double gapLength, double totalVoltage);

    /**
     * Напряжённость E(x) = -dφ/dx.
     */
    double fieldAt(double x, double gapLength, double totalVoltage);

    /**
     * Эффективная напряжённость ускоряющего поля вдоль траектории иона (14).
     */
    double acceleratingField(double pathLength, double gapLength, double totalVoltage);

    /**
     * Напряжение катодного падения V_dis (источник энергии ионов).
     */
    double cathodeFallVoltage(double totalVoltage);
}
