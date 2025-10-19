package plasmaApi.project.plasmaApi.service.math.diffusion;

import org.springframework.stereotype.Service;
import plasmaApi.project.plasmaApi.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmaApi.project.plasmaApi.dto.mathDto.diffusion.DiffusionRequest;

import java.util.ArrayList;
import java.util.List;

@Service
public class DiffusionServiceImpl implements DiffusionService {

    private static final double DX = 1e-9;   // шаг по глубине (м)
    private static final double DT = 0.1;    // шаг по времени (с)

    /**
     * Расчёт концентрационного профиля C(x,t) по уравнению Фика.
     *  коэффициент диффузии (м²/с)
     *  начальная концентрация на поверхности
     *  общее время диффузии (с)
     *  глубина моделирования (м)
     * @return список концентраций по слоям
     */

    public DiffusionProfileDto calculateDiffusionProfile(DiffusionRequest dto) {

        int n = (int) (dto.depth() / DX);
        double[] C = new double[n];
        C[0] = dto.c0();

        // Проверка условия стабильности
        double stabilityCriterion = dto.D() * DT / (DX * DX);
        if (stabilityCriterion > 0.5) {
            throw new IllegalArgumentException(
                    "Нарушено условие стабильности: D * DT / DX^2 = " + stabilityCriterion
            );
        }

        int tSteps = (int) (dto.tMax() / DT);
        double[] newC = new double[n];

        for (int t = 0; t < tSteps; t++) {
            for (int i = 1; i < n - 1; i++) {
                newC[i] = C[i] + dto.D() * DT / (DX * DX) * (C[i + 1] - 2 * C[i] + C[i - 1]);
            }
            System.arraycopy(newC, 0, C, 0, n);
        }

        List<Double> depths = new ArrayList<>(n);
        List<Double> concentrations = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            depths.add(i * DX);
            concentrations.add(C[i]);
        }

        return new DiffusionProfileDto(depths, concentrations);
    }
}
