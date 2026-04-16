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

        // 🔹 fallback — одиночное столкновение
        if (ionComp == null && alloy == null) {
            return collisionService.simulate(
                    fallbackIon,
                    fallbackAtom,
                    ionEnergyEv,
                    impactParam,
                    Esurf
            );
        }

        double transferredSum = 0.0;
        double damageSum = 0.0;
        double thetaSum = 0.0;
        double impactSum = 0.0;

        double weightSum = 0.0;

        // =========================
        // 🔹 только сплав ионов
        // =========================
        if (alloy == null) {

            for (IonComponent ic : ionComp.getComponents()) {

                double w = ic.getFraction();

                CollisionResult r = collisionService.simulate(
                        ic.getIon(),
                        fallbackAtom,
                        ionEnergyEv,
                        impactParam,
                        Esurf
                );

                transferredSum += w * r.transferredEnergy();
                damageSum += w * r.damageEnergy();
                thetaSum += w * r.thetaCM();
                impactSum += w * r.impactParameter();

                weightSum += w;
            }
        }

        // =========================
        // 🔹 ion × alloy (pair averaging)
        // =========================
        else {

            assert ionComp != null;
            for (IonComponent ic : ionComp.getComponents()) {
                for (AlloyComponent ac : alloy.getComponents()) {

                    double w = ic.getFraction() * ac.getFraction();

                    CollisionResult r = collisionService.simulate(
                            ic.getIon(),
                            ac.getAtom(),
                            ionEnergyEv,
                            impactParam,
                            Esurf
                    );

                    transferredSum += w * r.transferredEnergy();
                    damageSum += w * r.damageEnergy();
                    thetaSum += w * r.thetaCM();
                    impactSum += w * r.impactParameter();

                    weightSum += w;
                }
            }
        }

        // 🔥 нормализация
        if (weightSum > 0.0) {
            transferredSum /= weightSum;
            damageSum /= weightSum;
            thetaSum /= weightSum;
            impactSum /= weightSum;
        }

        return CollisionResult.builder()
                .transferredEnergy(transferredSum)
                .damageEnergy(damageSum)
                .thetaCM(thetaSum)
                .impactParameter(impactSum)
                .build();
    }
}