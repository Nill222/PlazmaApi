package plasmapi.project.plasma.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Параллельное выполнение CPU-нагруженных расчётов в math-сервисах.
 */
@ConfigurationProperties(prefix = "plasma.math.parallel")
public class MathParallelProperties {

    /** Включить пулы потоков и параллельные циклы. */
    private boolean enabled = true;

    /**
     * Размер пула для расчётов (0 — число доступных процессоров).
     */
    private int poolSize = 0;

    /**
     * Максимум одновременных полных симуляций (семафор).
     */
    private int simulationMaxConcurrent = 4;

    /**
     * Минимальное число итераций, при котором имеет смысл распараллеливание.
     */
    private int minParallelItems = 32;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getPoolSize() {
        return poolSize;
    }

    public void setPoolSize(int poolSize) {
        this.poolSize = poolSize;
    }

    public int getSimulationMaxConcurrent() {
        return simulationMaxConcurrent;
    }

    public void setSimulationMaxConcurrent(int simulationMaxConcurrent) {
        this.simulationMaxConcurrent = simulationMaxConcurrent;
    }

    public int getMinParallelItems() {
        return minParallelItems;
    }

    public void setMinParallelItems(int minParallelItems) {
        this.minParallelItems = minParallelItems;
    }

    public int resolvePoolSize() {
        if (poolSize > 0) {
            return poolSize;
        }
        return Math.max(1, Runtime.getRuntime().availableProcessors());
    }
}
