package plasmapi.project.plasma.service.math.ion;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.service.math.collision.CollisionService;
import plasmapi.project.plasma.service.math.diffusion.AlloyComponent;
import plasmapi.project.plasma.service.math.diffusion.AlloyComposition;

@Service
@RequiredArgsConstructor
public class IonCollisionAveragingService {

    private final CollisionService collisionService;

    public CollisionResult compute(
            IonComposition ionComp,
            AlloyComposition alloy,
            AtomList fallbackAtom,
            Ion fallbackIon,
            double ionEnergyEv,
            double impactParam,
            double Esurf
    ) {

        // 🔹 fallback — старая логика
        if (ionComp == null && alloy == null) {
            return collisionService.simulate(
                    fallbackIon,
                    fallbackAtom,
                    ionEnergyEv,
                    impactParam,
                    Esurf
            );
        }

        double totalTransferred = 0.0;
        double totalDamage = 0.0;
        double totalTheta = 0.0;
        double totalImpact = 0.0;

        // 🔹 нормировочный коэффициент (на всякий случай)
        double norm = 0.0;

        // --- 1️⃣ только ионы ---
        if (alloy == null) {

            for (IonComponent ic : ionComp.getComponents()) {

                double xi = ic.getFraction();

                CollisionResult r = collisionService.simulate(
                        ic.getIon(),
                        fallbackAtom,
                        ionEnergyEv,
                        impactParam,
                        Esurf
                );

                totalTransferred += xi * r.transferredEnergy();
                totalDamage += xi * r.damageEnergy();
                totalTheta += xi * r.thetaCM();
                totalImpact += xi * r.impactParameter();

                norm += xi;
            }
        }

        // --- 2️⃣ pair averaging (ion × alloy) ---
        else {

            for (IonComponent ic : ionComp.getComponents()) {
                for (AlloyComponent ac : alloy.getComponents()) {

                    double xi = ic.getFraction();
                    double xj = ac.getFraction();

                    double w = xi * xj;

                    CollisionResult r = collisionService.simulate(
                            ic.getIon(),
                            ac.getAtom(),
                            ionEnergyEv,
                            impactParam,
                            Esurf
                    );

                    totalTransferred += w * r.transferredEnergy();
                    totalDamage += w * r.damageEnergy();
                    totalTheta += w * r.thetaCM();
                    totalImpact += w * r.impactParameter();

                    norm += w;
                }
            }
        }

        // 🔥 защита от кривых долей
        if (norm > 0) {
            totalTransferred /= norm;
            totalDamage /= norm;
            totalTheta /= norm;
            totalImpact /= norm;
        }

        return CollisionResult.builder()
                .transferredEnergy(totalTransferred)
                .damageEnergy(totalDamage)
                .thetaCM(totalTheta)
                .impactParameter(totalImpact)
                .build();
    }
}