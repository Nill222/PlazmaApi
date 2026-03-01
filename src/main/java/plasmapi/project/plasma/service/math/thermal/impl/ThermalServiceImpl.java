package plasmapi.project.plasma.service.math.thermal.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.math.thermal.ThermalResult;
import plasmapi.project.plasma.service.math.thermal.ThermalService;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ThermalServiceImpl implements ThermalService {

    /**
     * Моделирует нагрев и охлаждение материала под действием ионного пучка.
     *
     * @param plasmaConfig конфигурация плазмы (содержит теплофизические свойства)
     * @param T0 начальная температура (К)
     * @param tMax максимальное время моделирования (с)
     * @param dt шаг по времени (с)
     * @param thickness толщина пластины (м)
     * @param powerInput мощность источника (Вт), если null — источник отключён
     * @param projectedRange средний пробег ионов (м), используется для профиля источника
     * @param boundaryCondition тип граничного условия на облучаемой поверхности
     * @param ambientTemp температура окружающей среды (для конвекции)
     * @param h коэффициент теплообмена (Вт/(м²·К)) для конвекции
     * @param N количество узлов сетки (если null, будет выбрано автоматически)
     * @return результат моделирования с профилями температур
     */
    public ThermalResult simulate(
            PlasmaConfiguration plasmaConfig,
            double T0,
            double tMax,
            double dt,
            double thickness,
            Double powerInput,
            Double projectedRange,
            BoundaryCondition boundaryCondition,
            double ambientTemp,
            double h,
            Integer N
    ) {
        // Теплофизические свойства
        double rho = plasmaConfig.getDensity();          // кг/м³
        double cp = plasmaConfig.getHeatCapacity();      // Дж/(кг·К)
        double kappa = plasmaConfig.getThermalConductivity(); // Вт/(м·К)

        double alpha = kappa / (rho * cp); // температуропроводность, м²/с

        // Определяем количество узлов сетки, если не задано
        if (N == null) {
            // Оценка: чтобы dx было не больше характерной длины (например, projectedRange/10)
            double dxMin = (projectedRange != null) ? projectedRange / 10 : thickness / 100;
            N = (int) Math.ceil(thickness / dxMin) + 1;
            // Но не менее 10 и не более 1000 для производительности
            N = Math.max(10, Math.min(1000, N));
        }
        double dx = thickness / (N - 1);

        // Проверка устойчивости явной схемы: dt <= dx^2 / (2*alpha)
        double dtMax = dx * dx / (2 * alpha);
        if (dt > dtMax) {
            // Можно либо уменьшить dt, либо выбросить исключение. Здесь уменьшим и выдадим предупреждение.
            dt = dtMax * 0.9;
            System.err.printf("Warning: time step too large, reduced to %g s for stability%n", dt);
        }
        int steps = (int) (tMax / dt);

        // Инициализация температурного поля
        double[] T = new double[N];
        for (int i = 0; i < N; i++) T[i] = T0;

        // Профиль источника (объёмная плотность мощности, Вт/м³)
        double[] source = new double[N];
        if (powerInput != null && powerInput > 0 && projectedRange != null && projectedRange > 0) {
            // Нормировка: интеграл source по толщине должен равняться powerInput / площадь?
            // Но powerInput — полная мощность на всю площадь. Площадь не задана, поэтому будем считать,
            // что powerInput — это мощность на единицу площади (плотность потока мощности, Вт/м²).
            // Тогда source(x) = powerInput / projectedRange * exp(-x/projectedRange).
            // Проверим: ∫0^∞ source dx = powerInput.
            double norm = 1.0 / projectedRange; // для экспоненциального профиля
            for (int i = 0; i < N; i++) {
                double x = i * dx;
                source[i] = powerInput * norm * Math.exp(-x / projectedRange);
            }
        } else {
            // Источник отключён
            for (int i = 0; i < N; i++) source[i] = 0.0;
        }

        // Подготовка для записи результатов (сохраняем каждый 10-й шаг для экономии памяти)
        List<double[]> temperatureProfiles = new ArrayList<>();
        List<Double> times = new ArrayList<>();
        temperatureProfiles.add(T.clone());
        times.add(0.0);

        // Основной цикл по времени
        for (int step = 0; step < steps; step++) {
            double[] T_new = T.clone();
            double time = (step + 1) * dt;

            // Внутренние узлы
            for (int i = 1; i < N - 1; i++) {
                double laplacian = (T[i-1] - 2*T[i] + T[i+1]) / (dx * dx);
                T_new[i] += dt * (alpha * laplacian + source[i] / (rho * cp));
            }

            // Граничные условия
            // Левая граница (x=0, облучаемая поверхность)
            switch (boundaryCondition) {
                case ADIABATIC:
                    T_new[0] = T_new[1];
                    break;
                case FIXED_TEMPERATURE:
                    T_new[0] = T0; // или другая фиксированная температура
                    break;
                case CONVECTIVE:
                    // Поток: -kappa * dT/dx = h * (T - Tamb) на границе
                    // Дискретизация: -kappa * (T[1] - T[0])/dx = h * (T[0] - Tamb)
                    // => T[0] = (T[1] + (h*dx/kappa)*Tamb) / (1 + h*dx/kappa)
                    double biot = h * dx / kappa;
                    T_new[0] = (T_new[1] + biot * ambientTemp) / (1 + biot);
                    break;
            }
            // Правая граница (x = thickness) — фиксированная температура T0 (термостат)
            T_new[N-1] = T0;

            T = T_new;

            // Сохраняем результаты с определённой частотой
            if (step % 10 == 0 || step == steps - 1) {
                temperatureProfiles.add(T.clone());
                times.add(time);
            }
        }

        return new ThermalResult(times, temperatureProfiles, T0, thickness);
    }

    public enum BoundaryCondition {
        ADIABATIC,      // нулевой поток тепла
        FIXED_TEMPERATURE, // фиксированная температура (T0)
        CONVECTIVE      // конвективный теплообмен с окружающей средой
    }
}
