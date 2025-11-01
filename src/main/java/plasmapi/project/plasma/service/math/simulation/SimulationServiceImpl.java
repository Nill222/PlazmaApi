package plasmapi.project.plasma.service.math.simulation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionRequest;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaParameters;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalDto;
import plasmapi.project.plasma.model.atom.Atom;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Config;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.repository.*;
import plasmapi.project.plasma.service.math.lattice.LatticeService;
import plasmapi.project.plasma.service.math.collision.CollisionService;
import plasmapi.project.plasma.service.math.diffusion.DiffusionService;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;
import plasmapi.project.plasma.service.math.thermal.ThermalService;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SimulationServiceImpl implements SimulationService {

    private static final double kB = 1.380649e-23;
    private static final double eCharge = 1.602176634e-19;
    private static final double R = 8.314462618;

    private final AtomRepository atomRepository;
    private final AtomListRepository atomListRepository;
    private final IonRepository ionRepository;
    private final ConfigRepository configRepository;
    private final ResultRepository resultRepository;

    private final LatticeService latticeService;
    private final CollisionService collisionService;
    private final DiffusionService diffusionService;
    private final PlasmaService plasmaService;
    private final ThermalService thermalService;

    /**
     * Run full simulation by SimulationRequest.
     */
    public SimulationResultDto runSimulation(SimulationRequestDto req) {

        // 1️⃣ Load entities
        Config config = configRepository.findById(req.configId())
                .orElseThrow(() -> new IllegalArgumentException("Config not found: " + req.configId()));
        Ion ion = ionRepository.findById(req.ionId())
                .orElseThrow(() -> new IllegalArgumentException("Ion not found: " + req.ionId()));

        // 2️⃣ Lattice
        List<Atom> atoms;
        if (req.generateLattice()) {
            latticeService.generateLattice(req.latticeRequest());
            atoms = atomRepository.findByConfigId(config.getId());
        } else {
            atoms = atomRepository.findByConfigId(config.getId());
            if (atoms.isEmpty()) {
                throw new IllegalStateException("No atoms in config " + config.getId());
            }
        }

        // 3️⃣ Plasma parameters — используем PlasmaDto
        PlasmaDto plasmaDto = new PlasmaDto(
                req.plasmaVoltage(),
                req.pressure() > 0 ? req.pressure() : 1e-3,
                req.electronTemp() > 0 ? req.electronTemp() : 3000.0
        );
        PlasmaParameters plasmaParams = plasmaService.calculate(plasmaDto);

        // 4️⃣ Ion energy
        double ionMass = ion.getMass();
        double ionEnergy = eCharge * req.plasmaVoltage();

        // 5️⃣ Collisions — используем CollisionDto
        double totalTransferred = 0.0;
        List<CollisionResult> collisions = new ArrayList<>();

        for (Atom atom : atoms) {
            AtomList atomType = atomListRepository.findById(atom.getAtomList().getId())
                    .orElseThrow(() -> new IllegalStateException("AtomList not found for atom id " + atom.getId()));

            CollisionDto collisionDto = new CollisionDto(
                    ionEnergy,
                    ionMass,
                    atomType.getMass(),
                    req.impactAngle()
            );

            CollisionResult collRes = collisionService.simulateCollision(collisionDto);
            collisions.add(collRes);
            totalTransferred += collRes.transferredEnergy();
        }

        double avgTransferredPerAtom = totalTransferred / atoms.size();
        double estimatedTemperature = avgTransferredPerAtom / kB;

        // 6️⃣ Thermal relaxation — используем ThermalDto
        ThermalDto thermalDto = new ThermalDto(
                estimatedTemperature,
                req.thermalConductivity() > 0 ? req.thermalConductivity() : 0.05,
                req.totalTime(),
                req.timeStep()
        );

        List<Double> coolingProfile = thermalService.simulateCooling(thermalDto);
        double finalTemperature = coolingProfile.get(coolingProfile.size() - 1);

        // 7️⃣ Diffusion
        double D0 = req.diffusionPrefactor() > 0 ? req.diffusionPrefactor() : 1e-4;
        double Q = req.activationEnergy() > 0 ? req.activationEnergy() : 1.6e-19;
        double diffusionCoefficient = D0 * Math.exp(-Q / (R * Math.max(1.0, finalTemperature)));

        DiffusionRequest diffReq = new DiffusionRequest(
                diffusionCoefficient,
                req.surfaceConcentration(),
                req.totalTime(),
                req.depth()
        );

        DiffusionProfileDto diffusion = diffusionService.calculateDiffusionProfile(diffReq);

        // 8️⃣ Aggregate result
        SimulationResultDto result = new SimulationResultDto(
                ion.getName(),
                atoms.get(0).getAtomList().getAtomName(),
                totalTransferred,
                avgTransferredPerAtom,
                finalTemperature,
                diffusionCoefficient,
                plasmaParams,
                collisions.stream().map(CollisionResult::transferredEnergy).collect(Collectors.toList()),
                diffusion,
                coolingProfile
        );

        // 9️⃣ Persist result
        Result resEntity = new Result();
        resEntity.setConfig(config);
        resEntity.setIon(ion);
        resEntity.setEnergy(totalTransferred);
        resEntity.setPotential(req.plasmaVoltage());
        resEntity.setTemperature(finalTemperature);
        resultRepository.save(resEntity);

        return result;
    }
}
