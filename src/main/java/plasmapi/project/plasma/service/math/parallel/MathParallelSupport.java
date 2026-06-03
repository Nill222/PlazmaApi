package plasmapi.project.plasma.service.math.parallel;

import plasmapi.project.plasma.config.MathParallelProperties;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.Semaphore;
import java.util.function.IntConsumer;
import java.util.function.IntToDoubleFunction;
import java.util.function.Supplier;
import java.util.stream.IntStream;

/**
 * Семафор для ограничения одновременных симуляций и выборочная параллелизация
 * тяжёлых пакетных циклов (ForkJoinPool, без вложенных задач в фиксированном пуле).
 */
public class MathParallelSupport {

    private static final ForkJoinPool CPU_POOL = ForkJoinPool.commonPool();

    private final MathParallelProperties properties;
    private final Semaphore simulationSemaphore;

    public MathParallelSupport(
            MathParallelProperties properties,
            Semaphore simulationSemaphore
    ) {
        this.properties = properties;
        this.simulationSemaphore = simulationSemaphore;
    }

    public boolean isEnabled() {
        return properties.isEnabled();
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

    /**
     * Параллельный цикл по индексам {@code [0, count)} — только для крупных независимых пакетов.
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
        IntStream.range(0, count).parallel().forEach(action);
    }

    /**
     * Параллельная сумма — только при большом числе шагов интегрирования.
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
        return IntStream.range(0, count).parallel().mapToDouble(term).sum();
    }

    /**
     * Два независимых этапа (thermal и plasma) — отдельные потоки common pool,
     * без блокировки фиксированного executor внутри расчётов.
     */
    public <A, B> StagePair<A, B> runStages(Supplier<A> first, Supplier<B> second) {
        if (!properties.isEnabled()) {
            return new StagePair<>(first.get(), second.get());
        }
        CompletableFuture<A> f1 = CompletableFuture.supplyAsync(first::get, CPU_POOL);
        CompletableFuture<B> f2 = CompletableFuture.supplyAsync(second::get, CPU_POOL);
        return new StagePair<>(f1.join(), f2.join());
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
}
