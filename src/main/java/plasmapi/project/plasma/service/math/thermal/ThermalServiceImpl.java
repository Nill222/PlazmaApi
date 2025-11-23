package plasmapi.project.plasma.service.math.thermal;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalDto;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalResultDto;
import plasmapi.project.plasma.service.math.potential.PotentialService;
import plasmapi.project.plasma.service.math.slr.SLRService;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Переработанный ThermalServiceImpl.

 * Входной DTO содержит минимальные данные; если чего-то не хватает — сервис извлекает параметры
 * из базы (PlasmaConfiguration, AtomList) или применяет физические эвристики.

 * Возвращает список температур (K) во времени от 0 до tMax с шагом dt.
 */
@Service
@RequiredArgsConstructor
public class ThermalServiceImpl implements ThermalService {

    private final PotentialService potentialService;
    private final SLRService slrService;

    private static final int NODES = 100; // количество узлов 1D решётки

    @Override
    public ThermalResultDto simulateCooling(ThermalDto dto) {
        if (dto == null) throw new IllegalArgumentException("ThermalDto required");

        double T0 = dto.initialTemperature();
        double tMax = dto.tMax();
        double dt = dto.dt();

        double thickness = dto.thickness();
        double dx = thickness / NODES;

        // локальная температура по слою
        double[] temp = new double[NODES];
        Arrays.fill(temp, T0);

        int steps = (int) Math.ceil(tMax / dt);

        List<Double> avgTemps = new ArrayList<>();
        avgTemps.add(T0);

        // энергия ионов → тепло
        double heatPower = dto.ionEnergy() / tMax;

        for (int step = 0; step < steps; step++) {

            double[] delta = new double[NODES];

            for (int i = 0; i < NODES; i++) {

                var potential = potentialService.computePotential(dx, i);
                double stiffness = Math.max(potential.stiffness(), 1e-12);

                double dT = (heatPower * dt) / (stiffness * dto.thermalConductivity());
                delta[i] = dT;
            }

            // === преобразуем 1D delta → 2D delta2d для SLR ===
            double[][] delta2d = new double[NODES][1];
            for (int i = 0; i < NODES; i++) {
                delta2d[i][0] = delta[i];
            }

            // === вызываем SLR строго по сигнатуре computeSLR(double[][], double) ===
            var slr = slrService.computeSLR(delta2d, 1.0);

            // === применяем локальное изменение ===
            for (int i = 0; i < NODES; i++) {
                temp[i] += slr.localSLR()[i][0];
            }

            // средняя температура слоя
            double avg = 0.0;
            for (double v : temp) avg += v;
            avgTemps.add(avg / NODES);
        }

        return new ThermalResultDto(avgTemps);
    }
}
