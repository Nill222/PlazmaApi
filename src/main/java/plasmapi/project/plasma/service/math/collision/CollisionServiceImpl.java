package plasmapi.project.plasma.service.math.collision;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.service.math.lattice.LatticePhysics;
import plasmapi.project.plasma.service.math.potential.PotentialService;

@Slf4j
@Service
@RequiredArgsConstructor
public class CollisionServiceImpl implements CollisionService {

    private final PotentialService potentialService;

    private static final double KB = 1.380649e-23;
    private static final double EV = 1.602176634e-19;

    /**
     * Симуляция одиночного столкновения иона с атомом решётки.
     * Формулы:
     *  - кинематический множитель T = 4 m1 m2 / (m1 + m2)^2 * E_proj
     *  - переданный импульс p = sqrt(2 mu T)
     *  - damageEnergy (NRT-like) = 0.8*T if T > 2*E_surf else 0
     *  - displacement x = sqrt(2*E_d / k_eff)
     *
     * Учитывается выбранный потенциал (через PotentialService), структура (LatticePhysics),
     * резонансный множитель dto.getXi() и угол падения.
     */
    @Override
    public CollisionResult simulate(CollisionDto dto) {
        if (dto == null) throw new IllegalArgumentException("CollisionDto required");

        // interatomic distance (if not provided - use nn distance)
        double latticeA = dto.latticeParameter() > 0 ? dto.latticeParameter() : (dto.atom() != null && dto.atom().getA() != null ? dto.atom().getA() * 1e-10 : 2.86e-10);
        double nn = LatticePhysics.nnDistance(dto.structure(), latticeA);
        double r = dto.distance() != null && dto.distance() > 0 ? dto.distance() : nn;

        AtomList atom = dto.atom();

        // potential at distance r
        var pot = potentialService.computePotentialForAtomByDistance(r, atom);
        double V = pot.value();      // potential energy (J)
        double k = Math.max(0.0, pot.stiffness()); // effective stiffness N/m
        double re = pot.re();

        // masses
        double mIon = dto.mIon();
        double mAtom = dto.mAtom();

        // angle
        double theta = Math.toRadians(dto.angle());
        double Eproj = dto.E() * Math.max(0.0, Math.cos(theta)); // energy projected along normal

        // kinematic transfer factor
        double kinematic = (4.0 * mIon * mAtom) / Math.pow(mIon + mAtom, 2.0);
        double transferred = kinematic * Eproj;

        // account for potential stiffness (stiffer lattice reduces effective transfer slightly)
        // scale factor chosen empirically: 1 / (1 + k/Ks) with Ks ~ 1e3..1e4 N/m to keep scale reasonable
        double KSCALE = 1e3;
        transferred *= 1.0 / (1.0 + k / KSCALE);

        // resonance multiplier (if present)
        double xi = dto.xi() != null ? dto.xi() : 1.0;
        transferred *= xi;

        // random scattering small noise (to model microstructural variation)
        double noise = (Math.random() - 0.5) * 0.02 * transferred;
        transferred = Math.max(0.0, transferred + noise);

        // reduced mass for momentum
        double mu = mIon * mAtom / (mIon + mAtom);
        double momentum = Math.sqrt(2.0 * mu * transferred);

        // surface / displacement energy (use dto.surfaceBindingEnergy or fallback e.g. 3 eV)
        double Esurf = dto.surfaceBindingEnergy() != null ? dto.surfaceBindingEnergy() : 3.0 * EV;

        // damage energy (NRT-like simple model)
        double damageEnergy = 0.0;
        if (transferred > 2.0 * Esurf) {
            damageEnergy = 0.8 * transferred;
        }

        // displacement (spring model) x = sqrt(2*E_d / k)
        double displacement = 0.0;
        if (damageEnergy > 0.0 && k > 1e-12) {
            displacement = Math.sqrt(2.0 * damageEnergy / k);
        }

        String potName = detectPotentialName(r, atom);

        CollisionResult res = new CollisionResult(
                transferred,
                momentum,
                damageEnergy,
                displacement,
                potName,
                r,
                re,
                k
        );

        log.debug("Collision simulated: E_in={} J, transferred={} J, momentum={} kg·m/s, damage={} J, disp={} m, pot={}",
                dto.E(), transferred, momentum, damageEnergy, displacement, potName);

        return res;
    }

    private String detectPotentialName(double r, AtomList atom) {
        double aAng = atom != null && atom.getA() != null ? atom.getA() : 2.86;
        double aMeters = aAng * 1e-10;
        double l0 = aMeters / 2.0;
        if (r < 0.7 * l0) return "Yukawa (screened Coulomb)";
        if (r < 1.35 * l0) return "Born-Mayer";
        if (r < 2.0 * l0) return "Morse";
        if (r < 2.5 * l0) return "Morse-switched";
        return "Cutoff/Zero";
    }
}
