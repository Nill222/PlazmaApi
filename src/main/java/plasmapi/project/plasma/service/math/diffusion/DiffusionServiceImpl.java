package plasmapi.project.plasma.service.math.diffusion;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionRequest;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class DiffusionServiceImpl implements DiffusionService {

    private static final double DX = 1e-9; // шаг по глубине (м)
    private static final double DT_DEFAULT = 0.1; // исходный шаг по времени (с)
    private static final double STABILITY_LIMIT = 0.5; // критерий устойчивости FTCS

    /**
     * Расчёт концентрационного профиля C(x,t) по уравнению Фика.
     * - Используется явная схема FTCS (Forward Time, Central Space)
     * - При нарушении критерия устойчивости шаг времени уменьшается автоматически
     */
    @Override
    public DiffusionProfileDto calculateDiffusionProfile(DiffusionRequest dto) {

        int n = (int) (dto.depth() / DX);
        if (n < 2) {
            throw new IllegalArgumentException("Глубина слишком мала для расчёта: n=" + n);
        }

        double[] C = new double[n];
        C[0] = dto.c0();

        double D = dto.D();
        double dt = DT_DEFAULT;

        // Проверяем условие стабильности и корректируем при необходимости
        double stabilityCriterion = D * dt / (DX * DX);
        if (stabilityCriterion > STABILITY_LIMIT) {
            double dtMax = STABILITY_LIMIT * DX * DX / D;
            log.warn("⚠ Нарушено условие стабильности: D*dt/Dx² = {} > 0.5. " +
                    "Шаг времени уменьшен с {} до {}", stabilityCriterion, dt, dtMax);
            dt = dtMax;
            stabilityCriterion = D * dt / (DX * DX);
        }

        // Число шагов по времени
        int tSteps = (int) (dto.tMax() / dt);
        double[] newC = new double[n];

        // Основной цикл по времени
        for (int t = 0; t < tSteps; t++) {
            for (int i = 1; i < n - 1; i++) {
                newC[i] = C[i] + D * dt / (DX * DX) * (C[i + 1] - 2 * C[i] + C[i - 1]);
            }

            // Граничные условия: на поверхности фиксированная концентрация, на глубине — нулевая производная
            newC[0] = dto.c0();         // поверхность поддерживает концентрацию
            newC[n - 1] = newC[n - 2];  // ∂C/∂x = 0 на глубине

            System.arraycopy(newC, 0, C, 0, n);
        }

        // Формируем профиль концентрации
        List<Double> depths = new ArrayList<>(n);
        List<Double> concentrations = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            depths.add(i * DX);
            concentrations.add(C[i]);
        }

        // Итоговый результат


        return new DiffusionProfileDto(depths, concentrations);
    }
}