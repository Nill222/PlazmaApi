package plasmapi.project.plasma.service.math.collision;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.atom.AtomListDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParametersDto;
import plasmapi.project.plasma.service.math.potential.PotentialService;
import plasmapi.project.plasma.service.math.simulation.SimulationService;
import plasmapi.project.plasma.service.math.slr.SLRService;

@Slf4j
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

        PotentialParametersDto pot = potentialService.computePotential(dto.distance(), dto.atom().getId());

        double theta = Math.toRadians(dto.angle());
        double kin = (4 * dto.mIon() * dto.mAtom()) / Math.pow(dto.mIon() + dto.mAtom(), 2);
        double transferred = kin * dto.E() * Math.max(0, Math.cos(theta));
        transferred *= 1.0 / (1.0 + pot.stiffness() / KSCALE);
        transferred *= 1.0 + (Math.random() - 0.5) * 0.02;

        if (transferred < 0) transferred = 0;

        // ------------------------------
        // Применяем SLR как коррекцию (не как полную замену)
        double[][] localEnergy = new double[1][1];
        localEnergy[0][0] = transferred;

        double fluence = dto.ionFlux() != null ? dto.ionFlux() : 0.0; // если flux, возможно нужно flux*exposureTime
        // используем угол в радианах (theta уже в радианах)
        var slrResult = slrService.computeSLR(localEnergy, 1.0, theta, fluence);

        // попытаемся взять локальное значение, если оно имеется и ненулевое
        double localSLR = 0.0;
        try {
            double[][] local = slrResult.localSLR();
            if (local != null && local.length > 0 && local[0].length > 0) {
                localSLR = local[0][0];
            }
        } catch (Exception ex) {
            log.debug("SLR local read failed: {}", ex.getMessage());
        }

        double globalSLR = slrResult.globalSLR();

        // Если SLR дал ноль (частый случай для 1x1) — не обнуляем transferred.
        // Иначе — применяем корректирующий множитель. Коэффициент k выбираем небольшой.
        double k = 0.2; // эмпирический коэффициент коррекции (можно настроить)
        if (localSLR > 0) {
            // локальная коррекция: усиливаем transferred пропорционально локальной SLR
            transferred = Math.max(transferred, localSLR);
        } else if (globalSLR > 0) {
            // глобальная коррекция: мягкое умножение
            transferred = transferred * (1.0 + k * globalSLR);
        } else {
            // если оба нули — можно добавить незначительную коррекцию от fluence*cos(theta)
            double small = 1.0 + 1e-3 * fluence * Math.max(0, Math.cos(theta));
            transferred = transferred * small;
        }
        // ------------------------------

        log.debug("after SLR transferred = {}", transferred);

        double mu = dto.mIon() * dto.mAtom() / (dto.mIon() + dto.mAtom());
        double momentum = Math.sqrt(Math.max(0, 2 * mu * transferred));

        double Esurf = dto.surfaceBindingEnergy() != null ? dto.surfaceBindingEnergy() : 3 * EV;
        double damageEnergy = transferred > 2 * Esurf ? 0.8 * transferred : 0.0;

        double displacement = 0;
        if (damageEnergy > 0 && pot.stiffness() > 1e-16)
            displacement = Math.sqrt(2 * damageEnergy / pot.stiffness());

        log.debug("damageEnergy '{}'", damageEnergy);
        log.debug("transferred '{}'", transferred);

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
