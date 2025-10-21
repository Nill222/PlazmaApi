package plasmapi.project.plasma.service.math.simulation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionRequest;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaParameters;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.model.atom.Atom;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Config;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.repository.*;
import plasmapi.project.plasma.service.math.Lattice.LatticeService;
import plasmapi.project.plasma.service.math.collision.CollisionService;
import plasmapi.project.plasma.service.math.diffusion.DiffusionService;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;

import java.util.List;


import java.util.ArrayList;
import java.util.stream.Collectors;

/**
 * Orchestrator service that runs a full simulation pipeline:
 *  - optionally generates lattice,
 *  - computes collision results,
 *  - computes diffusion profile,
 *  - returns aggregated SimulationResultDto.
 * NOTE: adjust DTO / repository method names if your project uses different names.
 */
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

    /**
     * Run full simulation by SimulationRequest.
     * The method is defensive: if lattice generation is requested it will call LatticeService,
     * otherwise it will load existing atoms from DB (by configId).
     * Required input fields in SimulationRequest (expected):
     *  - Long configId
     *  - Long ionId
     *  - Long atomListId (optional if atoms already present in config)
     *  - boolean generateLattice
     *  - LatticeGenerationRequest latticeRequest (used when generateLattice == true)
     *  - double plasmaVoltage (V)  <-- used as "plasmaEnergy" previously
     *  - double pressure (Pa) optional for plasmaService
     *  - double electronTemp (K) optional for plasmaService
     *  - double timeStep (s)
     *  - double totalTime (s)
     *  - double impactAngle (deg) optional
     */
    public SimulationResultDto runSimulation(SimulationRequestDto req) {

        // 1) load core entities
        Config config = configRepository.findById(req.configId())
                .orElseThrow(() -> new IllegalArgumentException("Config not found: " + req.configId()));
        Ion ion = ionRepository.findById(req.ionId())
                .orElseThrow(() -> new IllegalArgumentException("Ion not found: " + req.ionId()));

        // 2) build or load lattice (list of Atom DTOs or entities)
        List<Atom> atoms = new ArrayList<>();
        if (req.generateLattice()) {
            // latticeService.generateLattice returns List<AtomDto> in your implementation;
            // here we assume it saved atoms in DB and returns DTOs. We'll load saved atoms by config.
            latticeService.generateLattice(req.latticeRequest());
            atoms = atomRepository.findByConfigId(config.getId());
        } else {
            atoms = atomRepository.findByConfigId(config.getId());
            if (atoms.isEmpty()) {
                throw new IllegalStateException("No atoms in config " + config.getId() +
                        ". Either generate lattice or populate config.");
            }
        }

        // 3) plasma parameters (approximate). If user did not provide pressure/Te, supply defaults
        double pressure = req.pressure() > 0 ? req.pressure() : 1e-3;       // Pa (example default)
        double electronT = req.electronTemp() > 0 ? req.electronTemp() : 3000.0; // K
        PlasmaParameters plasmaParams = plasmaService.calculate(req.plasmaVoltage(), pressure, electronT);

        // 4) compute ion energy from accelerating voltage: E_ion = e * U  (in J)
        // but we will use kinetic formulation consistent with other services:
        // v = sqrt(2 * e * U / m), E = 1/2 m v^2  -> which equals e*U, so consistent
        double ionMass = ion.getMass(); // must be in kg
        double U = req.plasmaVoltage();
        double ionEnergy = eCharge * U; // simple and consistent with prior formulas

        // 5) collisions for each atom: accumulate transferred energy and reflection
        double totalTransferred = 0.0;
        List<CollisionResult> collisions = new ArrayList<>();
        double impactAngle = req.impactAngle(); // degrees (can be 0 if not provided)

        for (Atom atom : atoms) {
            // atom.getAtomList may be LAZY; ensure it is initialized or query atomListRepository if needed
            AtomList atomType = atomListRepository.findById(atom.getAtomList().getId())
                    .orElseThrow(() -> new IllegalStateException("AtomList not found for atom id " + atom.getId()));
            double atomMass = atomType.getMass(); // mass in kg

            // compute collision
            CollisionResult collRes = collisionService.simulateCollision(ionEnergy, ionMass, atomMass, impactAngle);
            collisions.add(collRes);
            totalTransferred += collRes.transferredEnergy();
        }

        double avgTransferredPerAtom = totalTransferred / atoms.size();
        double estimatedTemperature = avgTransferredPerAtom / kB; // K

        // 6) compute diffusion coefficient D(T) (Arrhenius): D = D0 * exp(-Q/(R*T))
        double D0 = req.diffusionPrefactor() > 0 ? req.diffusionPrefactor() : 1e-4; // default m^2/s
        double Q = req.activationEnergy() > 0 ? req.activationEnergy() : 1.6e-19;   // J
        double diffusionCoefficient = D0 * Math.exp(-Q / (R * Math.max(1.0, estimatedTemperature)));

        // 7) build DiffusionRequest for DiffusionService
        DiffusionRequest diffReq = new DiffusionRequest(
                diffusionCoefficient,
                req.surfaceConcentration(), // c0
                req.totalTime(),
                req.depth()
        );

        DiffusionProfileDto diffusion = diffusionService.calculateDiffusionProfile(diffReq);

        // 8) aggregate result DTO
        SimulationResultDto result = new SimulationResultDto(
                ion.getName(),
                atoms.get(0).getAtomList().getAtomName(), // a representative atom name
                totalTransferred,
                avgTransferredPerAtom,
                estimatedTemperature,
                diffusionCoefficient,
                plasmaParams,
                collisions.stream().map(CollisionResult::transferredEnergy).collect(Collectors.toList()),
                diffusion
        );

        // 9) optionally persist a summary into results table (uncomment and adapt if you want)

        Result resEntity = new Result();
        resEntity.setConfig(config);
        resEntity.setIon(ion);
        resEntity.setEnergy(totalTransferred);
        resEntity.setPotential(U);
        resEntity.setTemperature(estimatedTemperature);
        resultRepository.save(resEntity);


        return result;
    }
}
