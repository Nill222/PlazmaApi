package plasmapi.project.plasma.service.math.diffusion;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.atom.AtomListDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaResultDto;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParametersDto;
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

    private static final double DEFAULT_D0 = 1e-18; // м^2/с
    private static final double R_J_MOLK = 8.314462618; // Дж/(моль·К)
    private static final int DEFAULT_NODES = 200;

    @Override
    public DiffusionProfileDto calculateFromConfig(Integer configId, Integer atomListId, double exposureTime) {
        AtomListDto atom = simulationService.getAtomList(atomListId);
        PlasmaResultDto plasma = plasmaService.calculate(configId);
        ThermalDto thermalInput = simulationService.getThermalInput(configId, atomListId, exposureTime);
        ThermalResultDto thermal = thermalService.simulateCooling(thermalInput);

        List<Double> temperatures = thermal.temperatures();
        double finalT = temperatures.get(temperatures.size() - 1);

        double D0 = atom.diffusionPrefactor() != null ? atom.diffusionPrefactor() : DEFAULT_D0;
        double Q = calculateActivationEnergy(atom);

        // Термально активная диффузия
        double D_thermal = finalT > 1.0 ? D0 * Math.exp(-Q / (R_J_MOLK * finalT)) : D0;

        // Коллизии
        CollisionDto collisionInput = simulationService.getCollisionInput(
                atomListId, 1e-9, plasma.ionEnergy(),
                plasma.electronVelocity() > 0 ? Math.atan(plasma.currentDensity() / plasma.electronVelocity()) : 0
        );
        CollisionResult collision = collisionService.simulate(collisionInput);
        double D_collision = D_thermal * (1.0 + collision.transferredEnergy() * 1e-3);

        // Потенциал атома
        PotentialParametersDto potential = potentialService.computePotential(atom.A(), atomListId);
        double D_potential = D_collision * (1.0 + Math.abs(potential.stiffness()) * 1e-20);

        // SLR
        double[][] tempProfile = new double[1][temperatures.size()];
        for(int i=0;i<temperatures.size();i++) tempProfile[0][i] = temperatures.get(i);
        double slrFactor = slrService.computeSLR(tempProfile, 1.0).globalSLR();
        double D_slr = D_potential * (1.0 + slrFactor);

        // Резонанс
        double xi = resonanceService.computeXi(atomListId, null); // можно передавать параметры, если есть
        double D_effective = D_slr * xi;

        // Средняя глубина проникновения
        double meanDepth = Math.sqrt(2 * D_effective * exposureTime);
        if (meanDepth < 1e-12) meanDepth = 1e-12;

        // Профиль проникновения
        List<Double> depths = new ArrayList<>();
        List<Double> conc = new ArrayList<>();
        double dx = meanDepth * 6.0 / (DEFAULT_NODES - 1);
        for (int i = 0; i < DEFAULT_NODES; i++) {
            double x = i * dx;
            depths.add(x);
            conc.add(Math.exp(-x / meanDepth));
        }

        return new DiffusionProfileDto(depths, conc);
    }

    private double calculateActivationEnergy(AtomListDto atom) {
        if (atom.cohesiveEnergyEv() != null) {
            double Q = atom.cohesiveEnergyEv() * 1.602176634e-19 * 6.02214076e23;
            return 0.4 * Q;
        }
        if (atom.morseDeEv() != null) {
            double Q = atom.morseDeEv() * 1.602176634e-19 * 6.02214076e23;
            return 0.5 * Q;
        }
        if (atom.DebyeTemperature() != null) {
            final double kB = 1.380649e-23;
            return kB * atom.DebyeTemperature() * 5 * 6.02214076e23;
        }
        return 1e5;
    }
}
