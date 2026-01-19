package plasmapi.project.plasma.service.math.diffusion;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.controller.handler.exception.NotFoundException;
import plasmapi.project.plasma.dto.mathDto.atom.AtomListDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaResultDto;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParametersDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalDto;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalResultDto;
import plasmapi.project.plasma.service.math.collision.CollisionService;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;
import plasmapi.project.plasma.service.math.potential.PotentialService;
import plasmapi.project.plasma.service.math.resonanse.ResonanceService;
import plasmapi.project.plasma.service.math.simulation.SimulationService;
import plasmapi.project.plasma.service.math.slr.SLRService;
import plasmapi.project.plasma.service.math.thermal.ThermalService;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiffusionServiceImpl implements DiffusionService {

    private final SimulationService simulationService;
    private final PlasmaService plasmaService;
    private final ThermalService thermalService;
    private final CollisionService collisionService;
    private final PotentialService potentialService;
    private final SLRService slrService;
    private final ResonanceService resonanceService;

    private static final double MIN_T = 1.0;
    private static final double MIN_D = 1e-40;
    private static final double MAX_D = 1e-6;

    private static final double R = 8.314462618;
    private static final int DEFAULT_NODES = 200;

    private static final double DEFAULT_D1 = 1e-18;
    private static final double DEFAULT_D2 = 1e-19;

    @Override
    public DiffusionProfileDto calculateFromConfig(
            SimulationRequestDto dto,
            Integer configId,
            Integer atomListId,
            double exposureTime,
            double temp,
            double ignoredIonEnergy) {

        // ===== 1. ATOM =====
        AtomListDto atom = simulationService.getAtomList(atomListId);
        if (atom == null)
            throw new NotFoundException("Atom not found");

        // ===== 2. Thermal =====
        ThermalDto thermalInput = simulationService.getThermalInput(
                configId, atomListId, exposureTime, temp);
        ThermalResultDto thermal = thermalService.simulateCooling(thermalInput);

        double finalT = Math.max(thermal.temperatures().get(thermal.temperatures().size() - 1), MIN_T);

        // ===== 3. Plasma =====
        PlasmaResultDto plasma = plasmaService.calculate(dto);
        double ionEnergy = plasma.ionEnergy();
        double ionFlux = plasma.ionFlux();      // NEW ✔

        double fluence = ionFlux * exposureTime; // NEW ✔

        // ===== 4. Arrhenius (2 канала) =====
        double D1 = atom.diffusionPrefactor1() != null ? atom.diffusionPrefactor1() : DEFAULT_D1;
        double D2 = atom.diffusionPrefactor2() != null ? atom.diffusionPrefactor2() : DEFAULT_D2;

        double Q1 = activationEnergy1(atom);
        double Q2 = activationEnergy2(atom);

        // ===== 5. Потенциал =====
        PotentialParametersDto potential = potentialService.computePotential(atom.A(), atomListId);
        double Veff = potential.stiffness() * potential.re();

        double alpha = 0.25;
        double beta = 1e-3;

        double Q1_mod = Q1 + alpha * Veff;
        double Q2_mod = Q2 + alpha * Veff;

        double term1 = D1 * Math.exp(-Q1_mod / (R * finalT));
        double term2 = D2 * Math.exp(-Q2_mod / (R * finalT));

        double D_thermal = (term1 + term2) * Math.exp(-beta * potential.stiffness());
        D_thermal = clamp(D_thermal);

        // ===== 6. Collision with fluence =====
        CollisionDto collInput = simulationService.getCollisionInput(
                atomListId,
                1e-9,
                ionEnergy,
                dto.angle(),
                fluence // NEW ✔
        );

        CollisionResult coll = collisionService.simulate(collInput);

        double kB = 1.380649e-23;
        double energyScale = Math.max(kB * finalT, 1e-21);

        double E_total = Math.max(coll.transferredEnergy() + ionEnergy, 0);

        double exponent = Math.min(E_total / (20 * energyScale), 20);
        double D_collision = clamp(D_thermal * Math.exp(exponent));

        // ===== 7. SLR NEW version =====
        double[][] tempProfile = new double[1][thermal.temperatures().size()];
        for (int i = 0; i < tempProfile[0].length; i++)
            tempProfile[0][i] = thermal.temperatures().get(i);

        double thetaRad = Math.toRadians(dto.angle());

        double slrFactor = slrService
                .computeSLR(tempProfile, 1.0, thetaRad, fluence)
                .globalSLR();

        slrFactor = Math.min(Math.max(slrFactor, 0), 10);

        double D_slr = clamp(D_collision * (1.0 + 0.05 * slrFactor));

        // ===== 8. Resonance =====
        double xi = Math.min(Math.max(resonanceService.computeXi(atomListId, null), 0), 50);

        double D_effective = clamp(D_slr * Math.max(1.0, Math.log1p(xi)));

        // ===== 9. Depth =====
        double meanDepth = Math.sqrt(2 * D_effective * exposureTime);
        if (meanDepth < 1e-12)
            meanDepth = 1e-12;

        // ===== 10. Profile =====
        List<Double> depths = new ArrayList<>();
        List<Double> conc = new ArrayList<>();
        double dx = meanDepth * 6.0 / (DEFAULT_NODES - 1);

        for (int i = 0; i < DEFAULT_NODES; i++) {
            double x = i * dx;
            depths.add(x);
            conc.add(Math.exp(-x / meanDepth));
        }

        return new DiffusionProfileDto(
                D1,
                D2,
                Q1,
                Q2,
                D_thermal,
                D_effective,
                meanDepth
        );
    }

    // ==================================
    // Вспомогательные методы
    // ==================================

    private double clamp(double D) {
        if (Double.isNaN(D)) return MIN_D;
        return Math.min(Math.max(D, MIN_D), MAX_D);
    }

    private double activationEnergy1(AtomListDto atom) {
        if (atom.cohesiveEnergyEv1() != null)
            return atom.cohesiveEnergyEv1() * 1.602176634e-19 * 6.02214076e23 * 0.25;
        return 8e4;
    }

    private double activationEnergy2(AtomListDto atom) {
        if (atom.cohesiveEnergyEv2() != null)
            return atom.cohesiveEnergyEv2() * 1.602176634e-19 * 6.02214076e23 * 0.45;
        return 1.5e5;
    }
}
