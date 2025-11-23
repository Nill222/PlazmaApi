package plasmapi.project.plasma.service.math.thermal;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalDto;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalResultDto;
import plasmapi.project.plasma.service.math.potential.PotentialService;
import plasmapi.project.plasma.service.math.slr.SLRService;

import java.util.ArrayList;
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

    private static final int DEFAULT_NODES = 100;

    @Override
    public ThermalResultDto simulateCooling(ThermalDto dto) {
        if (dto == null) throw new IllegalArgumentException("ThermalDto required");

        double T0 = dto.T0() != null ? dto.T0() : 300.0;
        double tMax = dto.tMax() != null ? dto.tMax() : 1.0;
        double dt = dto.dt() != null ? dto.dt() : 0.01;
        double thickness = dto.thickness() != null ? dto.thickness() : 1e-6;

        // Разбиваем толщину на узлы
        double dx = thickness / DEFAULT_NODES;
        double[][] localTemp = new double[DEFAULT_NODES][1]; // одномерная модель слоя

        // Инициализация
        for (int i = 0; i < DEFAULT_NODES; i++) {
            localTemp[i][0] = T0;
        }

        int steps = (int) Math.ceil(tMax / dt);
        List<Double> tempsOverTime = new ArrayList<>();
        tempsOverTime.add(T0);

        for (int step = 1; step <= steps; step++) {
            // Рассчитываем локальные влияния
            double[][] dT = new double[DEFAULT_NODES][1];
            for (int i = 0; i < DEFAULT_NODES; i++) {
                // Потенциал атома
                // пример: расстояние между атомами
                double stiffness = potentialService.computePotential(dx, dto.atom().getId()).stiffness();

                // Простое приближение: чем выше жёсткость, тем меньше локальное изменение температуры
                double deltaT = dto.powerInput() != null ? dto.powerInput() * dt / stiffness : 0.0;
                dT[i][0] = deltaT;
            }

            // Применяем локальную структурную релаксацию (SLR)
            var slrResult = slrService.computeSLR(dT, 1.0); // slrParam=1.0, можно параметризовать

            // Обновляем локальные температуры
            for (int i = 0; i < DEFAULT_NODES; i++) {
                localTemp[i][0] += slrResult.localSLR()[i][0];
            }

            // Средняя температура по слою
            double avgTemp = 0.0;
            for (int i = 0; i < DEFAULT_NODES; i++) avgTemp += localTemp[i][0];
            avgTemp /= DEFAULT_NODES;
            tempsOverTime.add(avgTemp);
        }

        return new ThermalResultDto(tempsOverTime);
    }
}
