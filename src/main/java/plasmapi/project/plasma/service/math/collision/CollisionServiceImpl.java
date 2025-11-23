package plasmapi.project.plasma.service.math.collision;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.atom.AtomListDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParametersDto;
import plasmapi.project.plasma.service.math.potential.PotentialService;
import plasmapi.project.plasma.service.math.simulation.SimulationService;
import plasmapi.project.plasma.service.math.slr.SLRService;

@Service
@RequiredArgsConstructor
public class CollisionServiceImpl implements CollisionService {

    private final SimulationService simulationService;
    private final PotentialService potentialService;
    private final SLRService slrService;

    private static final double EV = 1.602176634e-19;
    private static final double KSCALE = 1e3;

    @Override
    public CollisionResult simulate(CollisionDto dto) {
        if (dto == null) throw new IllegalArgumentException("CollisionDto required");

        AtomListDto atom = simulationService.getAtomList(dto.atom().getId());
        if (atom == null) throw new IllegalArgumentException("AtomList required");

        // Потенциал атома
        PotentialParametersDto pot = potentialService.computePotential(dto.distance(), dto.atom().getId());

        double theta = Math.toRadians(dto.angle());
        double kin = (4 * dto.mIon() * dto.mAtom()) / Math.pow(dto.mIon() + dto.mAtom(), 2);
        double transferred = kin * dto.E() * Math.max(0, Math.cos(theta));
        transferred *= 1.0 / (1.0 + pot.stiffness() / KSCALE);
        transferred *= 1.0 + (Math.random() - 0.5) * 0.02;

        if (transferred < 0) transferred = 0;

        // ------------------------------
        // Применяем SLR к локальной энергии удара
        double[][] localEnergy = new double[1][1]; // одномерная модель
        localEnergy[0][0] = transferred;
        var slrResult = slrService.computeSLR(localEnergy, 1.0); // slrParam=1.0
//        transferred = slrResult.globalSLR(); // усреднённая энергия после SLR
        // ------------------------------

        double mu = dto.mIon() * dto.mAtom() / (dto.mIon() + dto.mAtom());
        double momentum = Math.sqrt(Math.max(0, 2 * mu * transferred));

        double Esurf = dto.surfaceBindingEnergy() != null ? dto.surfaceBindingEnergy() : 3 * EV;
        double damageEnergy = transferred > 2 * Esurf ? 0.8 * transferred : 0.0;

        double displacement = 0;
        if (damageEnergy > 0 && pot.stiffness() > 1e-16)
            displacement = Math.sqrt(2 * damageEnergy / pot.stiffness());

        return new CollisionResult(
                transferred,
                momentum,
                damageEnergy,
                displacement,
                "Potential + SLR",
                dto.distance(),
                pot.re(),
                pot.stiffness()
        );
    }
}
