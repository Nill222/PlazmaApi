package plasmapi.project.plasma.service.math.energy;

/**
 * Функция энергетического усиления (2).
 */
public interface EnergyGainService {

    /**
     * G(L) — безразмерный множитель усиления при пролёте расстояния L от анода до точки на поверхности.
     */
    double computeGain(double pathLengthFromAnode, double cathodeFallVoltage);
}
