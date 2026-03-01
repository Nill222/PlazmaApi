package plasmapi.project.plasma.service.math.plazma.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.PhysicalConstants;
import plasmapi.project.plasma.service.math.plazma.PlasmaResult;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;

@Service
@RequiredArgsConstructor
public class PlasmaServiceImpl implements PlasmaService {

    /**
     * Рассчитывает энергию и поток ионов на основе конфигурации плазмы.
     *
     * @param cfg конфигурация плазмы (может содержать переопределение энергии и геометрию)
     * @param ion тип иона (содержит заряд)
     * @param ionFluxOverride если задан, используется как фиксированное значение потока (ион/м²·с),
     *                        иначе поток вычисляется из тока и геометрии.
     * @return результат с энергией (эВ) и потоком (ион/м²·с)
     * @throws IllegalArgumentException если не хватает данных для расчёта
     */
    @Override
    public PlasmaResult calculate(PlasmaConfiguration cfg, Ion ion, Double ionFluxOverride) {
        // 1. Определяем энергию иона
        double ionEnergyEv;
        if (cfg.getIonEnergyOverride() != null) {
            ionEnergyEv = cfg.getIonEnergyOverride();
        } else {
            if (cfg.getVoltage() == null) {
                throw new IllegalArgumentException("Voltage must be set when ionEnergyOverride is not provided");
            }
            if (ion.getCharge() == null) {
                throw new IllegalArgumentException("Ion charge must be set");
            }
            ionEnergyEv = cfg.getVoltage() * ion.getCharge(); // энергия в эВ (предполагаем, что напряжение в В)
        }

        // 2. Определяем поток ионов
        double ionFlux;
        if (ionFluxOverride != null) {
            ionFlux = ionFluxOverride;
        } else {
            if (cfg.getCurrent() == null || cfg.getChamberWidth() == null || cfg.getChamberDepth() == null) {
                throw new IllegalArgumentException("Current, chamberWidth and chamberDepth must be set when flux is not overridden");
            }
            // Плотность тока: J = I / (ширина * глубина) [А/м²]
            double area = cfg.getChamberWidth() * cfg.getChamberDepth();
            double currentDensity = cfg.getCurrent() / area; // А/м²

            // Заряд иона в кулонах
            double ionChargeCoulombs = ion.getCharge() * PhysicalConstants.E_CHARGE;

            // Поток ионов: Γ = J / (q_i)  [ион/(м²·с)]
            ionFlux = currentDensity / ionChargeCoulombs;
        }

        return new PlasmaResult(ionEnergyEv, ionFlux);
    }
}