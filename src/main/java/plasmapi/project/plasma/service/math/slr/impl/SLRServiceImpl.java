package plasmapi.project.plasma.service.math.slr.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.service.math.slr.SLRService;

@Service
public class SLRServiceImpl implements SLRService {

    @Value("${slr.k:1e-26}")
    private double K_SLR;

    @Value("${slr.eta:0.5}")
    private double ETA;

    private static final double MAX_FACTOR = 100.0;

    /**
     * Вычисляет коэффициент усиления диффузии за счёт ионного перемешивания (SLR).
     *
     * @param fluence полный флюенс ионов (ион/м²)
     * @param thetaRad угол падения ионов относительно нормали (рад)
     * @return безразмерный фактор SLR, ограниченный сверху значением MAX_FACTOR
     * @throws IllegalArgumentException если fluence < 0 или угол вне [0, π/2]
     */
    public double computeFactor(double fluence, double thetaRad) {
        if (fluence < 0) {
            throw new IllegalArgumentException("Fluence must be non-negative");
        }
        if (thetaRad < 0 || thetaRad > Math.PI / 2) {
            throw new IllegalArgumentException("Incidence angle must be between 0 and π/2 radians");
        }

        double cosTheta = Math.cos(thetaRad);
        double factor = 1.0 + K_SLR * Math.pow(fluence * cosTheta, ETA);
        return Math.min(factor, MAX_FACTOR);
    }
}
