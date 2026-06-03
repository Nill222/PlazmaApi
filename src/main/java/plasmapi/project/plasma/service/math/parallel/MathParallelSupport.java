package plasmapi.project.plasma.service.math.parallel;

import plasmapi.project.plasma.config.MathParallelProperties;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.Semaphore;
import java.util.function.IntConsumer;
import java.util.function.IntToDoubleFunction;
import java.util.function.Supplier;

/**
 * Пул потоков для math-сервисов и семафор, ограничивающий число одновременных симуляций.
 */
public class MathParallelSupport {

    private final MathParallelProperties properties;
    private final ExecutorService executor;
    private final Semaphore simulationSemaphore;

    public MathParallelSupport(
            MathParallelProperties properties,
            ExecutorService executor,
            Semaphore simulationSemaphore
    ) {
        this.properties = properties;
        this.executor = executor;
        this.simulationSemaphore = simulationSemaphore;
    }

    public boolean isEnabled() {
        return properties.isEnabled();
    }

    public ExecutorService executor() {
        return executor;
    }

    /**
     * Выполняет полную симуляцию с захватом семафора (если параллельность включена).
     */
    public <T> T runWithSimulationPermit(Supplier<T> task) {
        if (!properties.isEnabled()) {
            return task.get();
        }
        acquireSimulationPermit();
        try {
            return task.get();
        } finally {
            simulationSemaphore.release();
        }
    }

    public void runWithSimulationPermit(Runnable task) {
        runWithSimulationPermit(() -> {
            task.run();
            return null;
        });
    }

    /**
     * Параллельный цикл по индексам {@code [0, count)}.
     */
    public void parallelFor(int count, IntConsumer action) {
        if (count <= 0) {
            return;
        }
        if (!shouldParallelize(count)) {
            for (int i = 0; i < count; i++) {
                action.accept(i);
            }
            return;
        }
        awaitAll(submitChunks(count, action));
    }

    /**
     * Параллельная сумма {@code sum(fn(i))} для {@code i ∈ [0, count)}.
     */
    public double parallelSum(int count, IntToDoubleFunction term) {
        if (count <= 0) {
            return 0.0;
        }
        if (!shouldParallelize(count)) {
            double sum = 0.0;
            for (int i = 0; i < count; i++) {
                sum += term.applyAsDouble(i);
            }
            return sum;
        }

        int workers = Math.min(properties.resolvePoolSize() * 2, count);
        int chunkSize = (count + workers - 1) / workers;

        List<Callable<Double>> tasks = new ArrayList<>();
        for (int start = 0; start < count; start += chunkSize) {
            int from = start;
            int to = Math.min(count, start + chunkSize);
            tasks.add(() -> {
                double partial = 0.0;
                for (int i = from; i < to; i++) {
                    partial += term.applyAsDouble(i);
                }
                return partial;
            });
        }

        double total = 0.0;
        try {
            for (Future<Double> f : executor.invokeAll(tasks)) {
                total += f.get();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Parallel sum interrupted", e);
        } catch (ExecutionException e) {
            throw unwrap(e);
        }
        return total;
    }

    /**
     * Два независимых этапа расчёта (например, thermal и plasma).
     */
    public <A, B> StagePair<A, B> runStages(Supplier<A> first, Supplier<B> second) {
        if (!properties.isEnabled()) {
            return new StagePair<>(first.get(), second.get());
        }
        Future<A> f1 = executor.submit(first::get);
        Future<B> f2 = executor.submit(second::get);
        try {
            return new StagePair<>(f1.get(), f2.get());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            f1.cancel(true);
            f2.cancel(true);
            throw new IllegalStateException("Parallel stages interrupted", e);
        } catch (ExecutionException e) {
            f1.cancel(true);
            f2.cancel(true);
            throw unwrap(e);
        }
    }

    public record StagePair<A, B>(A first, B second) {}

    private boolean shouldParallelize(int count) {
        return properties.isEnabled() && count >= properties.getMinParallelItems();
    }

    private void acquireSimulationPermit() {
        try {
            simulationSemaphore.acquire();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Simulation permit acquire interrupted", e);
        }
    }

    private void awaitAll(List<Callable<Void>> tasks) {
        try {
            for (Future<Void> f : executor.invokeAll(tasks)) {
                f.get();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Parallel execution interrupted", e);
        } catch (ExecutionException e) {
            throw unwrap(e);
        }
    }

    private static RuntimeException unwrap(ExecutionException e) {
        Throwable cause = e.getCause();
        if (cause instanceof RuntimeException re) {
            return re;
        }
        if (cause instanceof Error err) {
            throw err;
        }
        return new IllegalStateException("Parallel math execution failed", cause);
    }

    private List<Callable<Void>> submitChunks(int count, IntConsumer action) {
        int workers = Math.min(properties.resolvePoolSize() * 2, count);
        int chunkSize = Math.max(1, (count + workers - 1) / workers);
        List<Callable<Void>> tasks = new ArrayList<>();
        for (int start = 0; start < count; start += chunkSize) {
            int from = start;
            int to = Math.min(count, start + chunkSize);
            tasks.add(() -> {
                for (int i = from; i < to; i++) {
                    action.accept(i);
                }
                return null;
            });
        }
        return tasks;
    }
}
