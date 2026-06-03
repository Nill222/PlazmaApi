package plasmapi.project.plasma.service.math.thermal.impl;

import java.util.ArrayList;
import java.util.List;

/**
 * Явная 1D схема теплопроводности: двойной буфер (без clone на каждый шаг).
 * Параллель по шагам времени здесь не используется — при 10⁵–10⁶ шагов барьер/потоки
 * на каждом шаге только замедляют расчёт.
 */
final class ThermalTimeLoop {

    private ThermalTimeLoop() {
    }

    static Result run(State state) {
        double[] current = state.t;
        double[] next = state.tNext;
        List<double[]> profiles = new ArrayList<>();
        List<Double> times = new ArrayList<>();
        profiles.add(current.clone());
        times.add(0.0);

        int saveEvery = Math.max(state.steps / 500, 1);
        boolean trackDebye = state.debyeLimit < Double.POSITIVE_INFINITY;
        boolean cyclingVaries = state.thermalCyclingEnabled
                && state.cyclePeriod != null
                && state.cyclePeriod > 0;

        final int n = state.n;
        final int innerEnd = n - 1;
        final double laplacianCoeff = state.laplacianCoeff;
        final double sourceCoeff = state.sourceCoeff;
        final double[] source = state.source;

        for (int step = 0; step < state.steps; step++) {
            double time = (step + 1) * state.dt;
            double cycling = cyclingVaries ? state.cyclingFactor(time) : 1.0;
            double sourceScale = sourceCoeff * cycling;

            for (int i = 1; i < innerEnd; i++) {
                double laplacian = current[i - 1] - 2.0 * current[i] + current[i + 1];
                double val = current[i] + laplacianCoeff * laplacian + sourceScale * source[i];
                if (val > state.debyeLimit) {
                    val = state.debyeLimit;
                }
                next[i] = val;
            }

            applyBoundaries(next, state);

            if (trackDebye) {
                trackDebye(next, state.debyeReachedAt, time, state.debyeLimit);
            }

            double[] tmp = current;
            current = next;
            next = tmp;

            if (step % saveEvery == 0 || step == state.steps - 1) {
                profiles.add(current.clone());
                times.add(time);
            }
        }

        return new Result(current, profiles, times);
    }

    private static void applyBoundaries(double[] field, State state) {
        switch (state.boundaryCondition) {
            case ADIABATIC -> field[0] = field[1];
            case FIXED_TEMPERATURE -> field[0] = state.t0;
            case CONVECTIVE -> {
                double biot = state.h * state.dx / state.kappa;
                field[0] = (field[1] + biot * state.ambientTemp) / (1.0 + biot);
            }
        }
        field[state.n - 1] = state.t0;
        if (field[0] > state.debyeLimit) {
            field[0] = state.debyeLimit;
        }
        if (field[state.n - 1] > state.debyeLimit) {
            field[state.n - 1] = state.debyeLimit;
        }
    }

    private static void trackDebye(double[] field, double[] debyeReachedAt, double time, double debyeLimit) {
        for (int i = 0; i < field.length; i++) {
            if (Double.isNaN(debyeReachedAt[i]) && field[i] >= debyeLimit) {
                debyeReachedAt[i] = time;
            }
        }
    }

    record Result(double[] finalField, List<double[]> profiles, List<Double> times) {}

    static final class State {
        final int n;
        final int steps;
        final double dt;
        final double dx;
        final double t0;
        final double ambientTemp;
        final double h;
        final double kappa;
        final double debyeLimit;
        final double laplacianCoeff;
        final double sourceCoeff;
        final double[] source;
        final double[] debyeReachedAt;
        final ThermalServiceImpl.BoundaryCondition boundaryCondition;
        final boolean thermalCyclingEnabled;
        final Double cyclePeriod;
        final Double dutyCycle;

        final double[] t;
        final double[] tNext;

        State(
                int n,
                int steps,
                double dt,
                double dx,
                double t0,
                double ambientTemp,
                double h,
                double kappa,
                double debyeLimit,
                double laplacianCoeff,
                double sourceCoeff,
                double[] source,
                double[] debyeReachedAt,
                ThermalServiceImpl.BoundaryCondition boundaryCondition,
                boolean thermalCyclingEnabled,
                Double cyclePeriod,
                Double dutyCycle,
                double[] initialT
        ) {
            this.n = n;
            this.steps = steps;
            this.dt = dt;
            this.dx = dx;
            this.t0 = t0;
            this.ambientTemp = ambientTemp;
            this.h = h;
            this.kappa = kappa;
            this.debyeLimit = debyeLimit;
            this.laplacianCoeff = laplacianCoeff;
            this.sourceCoeff = sourceCoeff;
            this.source = source;
            this.debyeReachedAt = debyeReachedAt;
            this.boundaryCondition = boundaryCondition;
            this.thermalCyclingEnabled = thermalCyclingEnabled;
            this.cyclePeriod = cyclePeriod;
            this.dutyCycle = dutyCycle;
            this.t = initialT;
            this.tNext = new double[n];
        }

        double cyclingFactor(double time) {
            if (!thermalCyclingEnabled || cyclePeriod == null || cyclePeriod <= 0) {
                return 1.0;
            }
            double duty = (dutyCycle == null) ? 0.5 : Math.max(0.01, Math.min(0.99, dutyCycle));
            double phase = time % cyclePeriod;
            return phase <= cyclePeriod * duty ? 1.0 : 0.0;
        }
    }
}
