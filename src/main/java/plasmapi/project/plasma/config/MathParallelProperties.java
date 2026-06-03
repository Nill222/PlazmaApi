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
     * Максимум одновременных полных симуляций (семафор).
     */
    private int simulationMaxConcurrent = 4;

    /**
     * Минимальное число итераций, при котором имеет смысл ForkJoin-parallel.
     */
    private int minParallelItems = 512;
}
