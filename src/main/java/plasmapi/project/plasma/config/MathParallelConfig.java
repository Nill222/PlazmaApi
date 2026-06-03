package plasmapi.project.plasma.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import plasmapi.project.plasma.service.math.parallel.MathParallelSupport;

import java.util.concurrent.Semaphore;

@Configuration
@EnableConfigurationProperties(MathParallelProperties.class)
public class MathParallelConfig {

    @Bean
    public Semaphore simulationSemaphore(MathParallelProperties properties) {
        int permits = Math.max(1, properties.getSimulationMaxConcurrent());
        return new Semaphore(permits, true);
    }

    @Bean
    public MathParallelSupport mathParallelSupport(
            MathParallelProperties properties,
            Semaphore simulationSemaphore
    ) {
        return new MathParallelSupport(properties, simulationSemaphore);
    }
}
