package plasmapi.project.plasma.service.math.collision;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;

import java.util.Random;

@Service
public class CollisionServiceImpl implements CollisionService {

    private final Random random = new Random();

    /**
     * Рассчитывает результат столкновения иона с атомом.
     *  E энергия иона (Дж)
     *  mIon масса иона
     *  mAtom масса атома
     *  angle угол падения (градусы)
     *  объект CollisionResult
     */
    public CollisionResult simulateCollision(CollisionDto collisionDto) {
        double theta = Math.toRadians(collisionDto.angle());
        double k = (4 * collisionDto.mIon() * collisionDto.mAtom()) / Math.pow(collisionDto.mIon() + collisionDto.mAtom(), 2);

        double Etr = collisionDto.E() * k * Math.cos(theta) * Math.cos(theta); // переданная энергия
        double reflection = 1.0 - k; // доля отражённой энергии
        double randomScattering = (random.nextDouble() - 0.5) * 0.1; // шум

        return new CollisionResult(Etr, reflection + randomScattering);
    }
}

