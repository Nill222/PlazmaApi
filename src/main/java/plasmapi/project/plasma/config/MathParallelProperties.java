package plasmapi.project.plasma.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Параллельное выполнение CPU-нагруженных расчётов в math-сервисах.
 */
@Setter
@Getter
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

    public int resolvePoolSize() {
        if (poolSize > 0) {
            return poolSize;
        }
        return Math.max(1, Runtime.getRuntime().availableProcessors());
    }
}
