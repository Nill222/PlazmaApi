package plasmapi.project.plasma.config;

import jakarta.annotation.PreDestroy;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import plasmapi.project.plasma.service.math.parallel.MathParallelSupport;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;

@Configuration
@EnableConfigurationProperties(MathParallelProperties.class)
public class MathParallelConfig {

    @Bean
    public ExecutorService mathComputationExecutor(MathParallelProperties properties) {
        int size = properties.resolvePoolSize();
        ThreadFactory factory = new ThreadFactory() {
            private final AtomicInteger seq = new AtomicInteger(1);

            @Override
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r, "plasma-math-" + seq.getAndIncrement());
                t.setDaemon(true);
                return t;
            }
        };
        return Executors.newFixedThreadPool(size, factory);
    }

    @Bean
    public Semaphore simulationSemaphore(MathParallelProperties properties) {
        int permits = Math.max(1, properties.getSimulationMaxConcurrent());
        return new Semaphore(permits, true);
    }

    @Bean
    public MathParallelSupport mathParallelSupport(
            MathParallelProperties properties,
            ExecutorService mathComputationExecutor,
            Semaphore simulationSemaphore
    ) {
        return new MathParallelSupport(properties, mathComputationExecutor, simulationSemaphore);
    }

    @PreDestroy
    public void shutdownMathExecutor(ExecutorService mathComputationExecutor) {
        mathComputationExecutor.shutdown();
    }
}
