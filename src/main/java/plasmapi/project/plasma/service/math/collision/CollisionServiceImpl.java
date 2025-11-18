package plasmapi.project.plasma.service.math.collision;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.service.math.lattice.LatticePhysics;

import java.util.Random;

@Service
@RequiredArgsConstructor
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
    @Override
    public CollisionResult simulateCollision(CollisionDto dto) {
        double theta = Math.toRadians(dto.angle());
        double mIon = dto.mIon();
        double mAtom = dto.mAtom();

        double kMass = (4 * mIon * mAtom) / Math.pow(mIon + mAtom, 2);
        double structFactor = dto.structure() != null ? LatticePhysics.collisionStructureFactor(dto.structure()) : 1.0;

        double stiffnessFactor = 1.0;
        if (dto.potential() != null) {
            double stiffness = dto.potential().stiffness();
            stiffnessFactor = 1.0 + Math.tanh(stiffness / 1e-19) * 0.2; // smooth scale
        }

        double k = kMass * structFactor * stiffnessFactor;
        double Etr = dto.E() * k * Math.cos(theta) * Math.cos(theta);

        double reflection = Math.max(0.0, 1.0 - k);
        double randomScattering = (random.nextDouble() - 0.5) * 0.05 * structFactor;

        return new CollisionResult(Etr, reflection + randomScattering);
    }
}
