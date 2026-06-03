package plasmapi.project.plasma.service.math.thermal.impl;

import plasmapi.project.plasma.config.MathParallelProperties;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Явная 1D схема теплопроводности: двойной буфер без clone на шаг,
 * опционально — параллель по внутренним узлам через барьер (потоки на весь расчёт).
 */
final class ThermalTimeLoop {

    private ThermalTimeLoop() {
    }

    static Result run(State state, MathParallelProperties parallel) {
        int inner = state.innerCount();
        long work = (long) state.steps * inner;
        boolean useParallel = parallel.isEnabled()
                && parallel.isThermalParallelEnabled()
                && inner >= parallel.getThermalMinInnerNodes()
                && work >= parallel.getThermalMinTotalWork();

        if (useParallel) {
            return runParallel(state);
        }
        return runSequential(state);
    }

    static Result runSequential(State state) {
        double[] current = state.t;
        double[] next = state.tNext;
        List<double[]> profiles = new ArrayList<>();
        List<Double> times = new ArrayList<>();
        profiles.add(current.clone());
        times.add(0.0);

        int saveEvery = Math.max(state.steps / 500, 1);

        for (int step = 0; step < state.steps; step++) {
            double time = (step + 1) * state.dt;
            double cycling = state.cyclingFactor(time);

            advanceInnerNodes(current, next, state, cycling);

            applyBoundaries(next, state);
            trackDebye(next, state.debyeReachedAt, time, state.debyeLimit);

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

    static Result runParallel(State state) {
        int inner = state.innerCount();
        int threads = Math.min(
                Runtime.getRuntime().availableProcessors(),
                Math.max(1, inner / 64)
        );

        double[] current = state.t;
        double[] next = state.tNext;
        List<double[]> profiles = new ArrayList<>();
        List<Double> times = new ArrayList<>();
        profiles.add(current.clone());
        times.add(0.0);

        int saveEvery = Math.max(state.steps / 500, 1);
        CyclicBarrier barrier = new CyclicBarrier(threads + 1);
        AtomicBoolean active = new AtomicBoolean(true);

        int[][] ranges = partitionInner(state.n, threads);
        Thread[] workers = new Thread[threads];
        for (int w = 0; w < threads; w++) {
            final int from = ranges[w][0];
            final int to = ranges[w][1];
            workers[w] = new Thread(() -> workerLoop(
                    state, barrier, active, from, to
            ), "plasma-thermal-" + w);
            workers[w].setDaemon(true);
            workers[w].start();
        }

        try {
            for (int step = 0; step < state.steps; step++) {
                double stepTime = (step + 1) * state.dt;
                double cyclingFactor = state.cyclingFactor(stepTime);
                state.publishArrays(current, next, cyclingFactor);

                await(barrier);
                await(barrier);

                applyBoundaries(next, state);
                trackDebye(next, state.debyeReachedAt, stepTime, state.debyeLimit);

                double[] tmp = current;
                current = next;
                next = tmp;
                state.publishArrays(current, next, cyclingFactor);

                if (step % saveEvery == 0 || step == state.steps - 1) {
                    profiles.add(current.clone());
                    times.add(stepTime);
                }
            }
        } finally {
            active.set(false);
            try {
                await(barrier);
            } catch (IllegalStateException ignored) {
                // завершение воркеров
            }
            for (Thread worker : workers) {
                try {
                    worker.join(30_000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        return new Result(current, profiles, times);
    }

    private static void workerLoop(
            State state,
            CyclicBarrier barrier,
            AtomicBoolean active,
            int from,
            int to
    ) {
        while (active.get()) {
            try {
                await(barrier);
                if (!active.get()) {
                    break;
                }
                double cycling = state.sharedCyclingFactor();
                double[] src = state.sharedCurrent();
                double[] dst = state.sharedNext();
                advanceInnerRange(src, dst, state, cycling, from, to);
                await(barrier);
            } catch (IllegalStateException e) {
                if (!active.get()) {
                    break;
                }
                throw e;
            }
        }
    }

    private static void advanceInnerNodes(double[] current, double[] next, State state, double cycling) {
        advanceInnerRange(current, next, state, cycling, 1, state.n - 1);
    }

    private static void advanceInnerRange(
            double[] current,
            double[] next,
            State state,
            double cycling,
            int fromInclusive,
            int toExclusive
    ) {
        for (int i = fromInclusive; i < toExclusive; i++) {
            double laplacian = current[i - 1] - 2.0 * current[i] + current[i + 1];
            double val = current[i]
                    + state.laplacianCoeff * laplacian
                    + state.sourceCoeff * cycling * state.source[i];
            if (val > state.debyeLimit) {
                val = state.debyeLimit;
            }
            next[i] = val;
        }
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

    private static int[][] partitionInner(int n, int threads) {
        int inner = Math.max(0, n - 2);
        int[][] ranges = new int[threads][2];
        int chunk = Math.max(1, (inner + threads - 1) / threads);
        for (int w = 0; w < threads; w++) {
            ranges[w][0] = 1 + w * chunk;
            ranges[w][1] = Math.min(n - 1, 1 + (w + 1) * chunk);
        }
        return ranges;
    }

    private static void await(CyclicBarrier barrier) {
        try {
            barrier.await();
        } catch (Exception e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Thermal parallel step failed", e);
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

        double[] t;
        double[] tNext;
        private volatile double sharedCyclingFactor;
        private volatile double[] sharedCurrent;
        private volatile double[] sharedNext;

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
            publishArrays(t, tNext, 1.0);
        }

        int innerCount() {
            return Math.max(0, n - 2);
        }

        double cyclingFactor(double time) {
            if (!thermalCyclingEnabled) {
                return 1.0;
            }
            if (cyclePeriod == null || cyclePeriod <= 0) {
                return 1.0;
            }
            double duty = (dutyCycle == null) ? 0.5 : Math.max(0.01, Math.min(0.99, dutyCycle));
            double phase = time % cyclePeriod;
            return phase <= cyclePeriod * duty ? 1.0 : 0.0;
        }

        void publishArrays(double[] current, double[] next, double cycling) {
            this.sharedCurrent = current;
            this.sharedNext = next;
            this.sharedCyclingFactor = cycling;
        }

        double sharedCyclingFactor() {
            return sharedCyclingFactor;
        }

        double[] sharedCurrent() {
            return sharedCurrent;
        }

        double[] sharedNext() {
            return sharedNext;
        }
    }
}
