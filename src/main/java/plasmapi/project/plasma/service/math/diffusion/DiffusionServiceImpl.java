package plasmapi.project.plasma.service.math.diffusion;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionRequest;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;


@Slf4j
@Service
public class DiffusionServiceImpl implements DiffusionService {

    private static final double DX = 1e-9; // шаг по глубине (м)
    private static final double DT_DEFAULT = 0.1; // шаг по времени (с)

    /**
     * Расчёт концентрационного профиля C(x,t) с использованием неявной схемы Crank–Nicolson
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

        // Число шагов по времени
        int tSteps = (int) (dto.tMax() / dt);

        // Формируем коэффициенты для матрицы Crank-Nicolson
        double r = D * dt / (2 * DX * DX);

        // Трёхдиагональная матрица (n x n)
        double[] a = new double[n - 1]; // поддиагональ
        double[] b = new double[n];     // диагональ
        double[] c = new double[n - 1]; // наддиагональ

        Arrays.fill(b, 1 + 2 * r);
        for (int i = 0; i < n - 1; i++) {
            a[i] = -r;
            c[i] = -r;
        }

        // Основной цикл по времени
        double[] Cnew;
        for (int t = 0; t < tSteps; t++) {

            // Правая часть
            double[] d = new double[n];
            d[0] = C[0]; // граничное условие
            d[n - 1] = C[n - 1]; // ∂C/∂x = 0 на глубине

            for (int i = 1; i < n - 1; i++) {
                d[i] = r * C[i - 1] + (1 - 2 * r) * C[i] + r * C[i + 1];
            }

            // Решаем трёхдиагональную систему
            Cnew = thomasAlgorithm(a, b, c, d);

            System.arraycopy(Cnew, 0, C, 0, n);
        }

        // Формируем профиль концентрации
        List<Double> depths = new ArrayList<>(n);
        List<Double> concentrations = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            depths.add(i * DX);
            concentrations.add(C[i]);
        }

        return new DiffusionProfileDto(depths, concentrations);
    }

    /**
     * Метод решения трёхдиагональной системы (Thomas algorithm)
     */
    private double[] thomasAlgorithm(double[] a, double[] b, double[] c, double[] d) {
        int n = b.length;
        double[] cPrime = new double[n - 1];
        double[] dPrime = new double[n];

        cPrime[0] = c[0] / b[0];
        dPrime[0] = d[0] / b[0];

        for (int i = 1; i < n - 1; i++) {
            double m = b[i] - a[i - 1] * cPrime[i - 1];
            cPrime[i] = c[i] / m;
            dPrime[i] = (d[i] - a[i - 1] * dPrime[i - 1]) / m;
        }
        dPrime[n - 1] = (d[n - 1] - a[n - 2] * dPrime[n - 2]) / (b[n - 1] - a[n - 2] * cPrime[n - 2]);

        double[] x = new double[n];
        x[n - 1] = dPrime[n - 1];
        for (int i = n - 2; i >= 0; i--) {
            x[i] = dPrime[i] - cPrime[i] * x[i + 1];
        }
        return x;
    }
}
