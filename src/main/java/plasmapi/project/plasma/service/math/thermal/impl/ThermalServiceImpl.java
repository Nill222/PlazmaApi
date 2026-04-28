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
            Integer N,
            Double debyeTemperature,
            Double probeDepth,
            boolean thermalCyclingEnabled,
            Double cyclePeriod,
            Double dutyCycle
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
        if (thermalCyclingEnabled && cyclePeriod != null && cyclePeriod > 0) {
            // Для корректного термоциклирования держим хотя бы 25 шагов на период.
            dtMax = Math.min(dtMax, cyclePeriod / 25.0);
        }
        if (dt > dtMax) {
            // Можно либо уменьшить dt, либо выбросить исключение. Здесь уменьшим и выдадим предупреждение.
            dt = dtMax * 0.9;
            System.err.printf("Warning: time step too large, reduced to %g s for stability%n", dt);
        }
        int steps = (int) (tMax / dt);

        final int MAX_STEPS = 1_000_000;

        if (steps > MAX_STEPS) {
            System.err.printf(
                    "Warning: too many time steps (%d). Limiting to %d steps.%n",
                    steps, MAX_STEPS
            );
            steps = MAX_STEPS;
            dt = tMax / steps; // пересчитываем шаг, чтобы уложиться в tMax
        }

        // Инициализация температурного поля
        double[] T = new double[N];
        for (int i = 0; i < N; i++) T[i] = T0;
        double debyeLimit = (debyeTemperature != null && debyeTemperature > 0)
                ? debyeTemperature
                : Double.POSITIVE_INFINITY;
        double observationDepth = probeDepth != null ? probeDepth : thickness / 2.0;
        double observationDepthClamped = Math.max(0.0, Math.min(thickness, observationDepth));
        int observationIndex = (int) Math.round(observationDepthClamped / dx);
        observationIndex = Math.max(0, Math.min(N - 1, observationIndex));

        double[] debyeReachedAt = new double[N];
        for (int i = 0; i < N; i++) {
            debyeReachedAt[i] = Double.NaN;
            if (T[i] >= debyeLimit) {
                debyeReachedAt[i] = 0.0;
            }
        }

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
            double cyclingFactor = getCyclingFactor(time, thermalCyclingEnabled, cyclePeriod, dutyCycle);
            for (int i = 1; i < N - 1; i++) {
                double laplacian = (T[i-1] - 2*T[i] + T[i+1]) / (dx * dx);
                T_new[i] += dt * (alpha * laplacian + (cyclingFactor * source[i]) / (rho * cp));
                if (T_new[i] > debyeLimit) {
                    T_new[i] = debyeLimit;
                }
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
            if (T_new[0] > debyeLimit) T_new[0] = debyeLimit;
            if (T_new[N - 1] > debyeLimit) T_new[N - 1] = debyeLimit;

            for (int i = 0; i < N; i++) {
                if (Double.isNaN(debyeReachedAt[i]) && T_new[i] >= debyeLimit) {
                    debyeReachedAt[i] = time;
                }
            }

            T = T_new;

            // Сохраняем результаты с определённой частотой
            int saveEvery = Math.max(steps / 500, 1);

            if (step % saveEvery == 0 || step == steps - 1) {
                temperatureProfiles.add(T.clone());
                times.add(time);
            }
        }

        double finalProbeTemperature = T[observationIndex];
        double debyeReachTime = Double.NaN;
        double debyeFrontDepth = 0.0;
        for (int i = 0; i < N; i++) {
            if (!Double.isNaN(debyeReachedAt[i])) {
                double x = i * dx;
                if (x >= debyeFrontDepth) {
                    debyeFrontDepth = x;
                    debyeReachTime = debyeReachedAt[i];
                }
            }
        }
        double debyeFrontSpeed = (!Double.isNaN(debyeReachTime) && debyeReachTime > 0)
                ? debyeFrontDepth / debyeReachTime
                : 0.0;

        return new ThermalResult(
                times,
                temperatureProfiles,
                T0,
                thickness,
                observationDepthClamped,
                finalProbeTemperature,
                debyeLimit,
                debyeReachTime,
                debyeFrontDepth,
                debyeFrontSpeed
        );
    }

    private double getCyclingFactor(
            double time,
            boolean thermalCyclingEnabled,
            Double cyclePeriod,
            Double dutyCycle
    ) {
        if (!thermalCyclingEnabled) return 1.0;
        if (cyclePeriod == null || cyclePeriod <= 0) return 1.0;
        double duty = (dutyCycle == null) ? 0.5 : Math.max(0.01, Math.min(0.99, dutyCycle));
        double phase = time % cyclePeriod;
        return phase <= cyclePeriod * duty ? 1.0 : 0.0;
    }

    public enum BoundaryCondition {
        ADIABATIC,      // нулевой поток тепла
        FIXED_TEMPERATURE, // фиксированная температура (T0)
        CONVECTIVE      // конвективный теплообмен с окружающей средой
    }
}
