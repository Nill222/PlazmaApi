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

    private static final double DEFAULT_D0 = 1e-18; // м²/с
    private static final double R = 8.314462618;   // Дж/(моль·К)
    private static final int DEFAULT_NODES = 200;


    @Override
    public DiffusionProfileDto calculateFromConfig(
            SimulationRequestDto dto,
            Integer configId,
            Integer atomListId,
            double exposureTime,
            double temp,
            double ignoredIonEnergy // НЕ ИСПОЛЬЗУЕТСЯ
    ) {

        // --- 1. Атомный список ---
        AtomListDto atom = simulationService.getAtomList(atomListId);
        if (atom == null) throw new NotFoundException("Atom not found");

        // --- 2. Расчёт охлаждения ---
        ThermalDto thermalInput = simulationService.getThermalInput(
                configId, atomListId, exposureTime, temp
        );
        ThermalResultDto thermal = thermalService.simulateCooling(thermalInput);
        List<Double> temperatures = thermal.temperatures();
        double finalT = temperatures.get(temperatures.size() - 1);

        // --- 3. Получаем параметры плазмы ---
        PlasmaResultDto plasma = plasmaService.calculate(dto);
        double ionEnergy = plasma.ionEnergy(); // Дж, уже корректно учитывает заряд Z

        // --- 4. Базовый коэффициент диффузии ---
        double D0 = atom.diffusionPrefactor() != null ? atom.diffusionPrefactor() : DEFAULT_D0;
        double Q = activationEnergy(atom); // Дж/моль

        // Arrhenius
        double D_thermal = D0 * Math.exp(-Q / (R * finalT));


        // --- 5. Коллизии ---
        CollisionDto collisionInput = simulationService.getCollisionInput(
                atomListId,        // атом
                1e-9,              // расстояние
                ionEnergy,         // энергия ионов
                0.0
        );
        CollisionResult collision = collisionService.simulate(collisionInput);

        double kB = 1.380649e-23;
        double energyScale = kB * finalT;             // характерная тепловая энергия
        double E_total = collision.transferredEnergy() + ionEnergy;

        // мягкая экспоненциальная активация
        double D_collision = D_thermal * Math.exp(E_total / (10 * energyScale));


        // --- 6. Потенциал атома ---
        PotentialParametersDto potential = potentialService.computePotential(
                atom.A(),
                atomListId
        );

        // Жёсткость уменьшает диффузию
        double D_potential = D_collision * Math.exp(-potential.stiffness() * 1e-3);


        // --- 7. SLR ---
        double[][] tempProfile = new double[1][temperatures.size()];
        for (int i = 0; i < temperatures.size(); i++) tempProfile[0][i] = temperatures.get(i);

        double slrFactor = slrService.computeSLR(tempProfile, 1.0).globalSLR();

        // SLR слегка увеличивает диффузию
        double D_slr = D_potential * (1.0 + 0.1 * slrFactor);


        // --- 8. Резонанс ---
        double xi = resonanceService.computeXi(atomListId, null);

        // безопасное логарифмическое масштабирование
        double D_effective = D_slr * Math.max(1.0, Math.log1p(xi));


        // --- 9. Глубина проникновения ---
        double meanDepth = Math.sqrt(2 * D_effective * exposureTime);
        if (meanDepth < 1e-12) meanDepth = 1e-12;


        // --- 10. Профиль концентрации ---
        List<Double> depths = new ArrayList<>();
        List<Double> conc = new ArrayList<>();

        double dx = meanDepth * 6.0 / (DEFAULT_NODES - 1);

        for (int i = 0; i < DEFAULT_NODES; i++) {
            double x = i * dx;
            depths.add(x);
            conc.add(Math.exp(-x / meanDepth));
        }

        return new DiffusionProfileDto(depths, conc, D_effective);
    }


    // --------------------
    // Вспомогательная функция
    // --------------------
    private double activationEnergy(AtomListDto atom) {

        // Если есть энергия когезии
        if (atom.cohesiveEnergyEv() != null) {
            double Q = atom.cohesiveEnergyEv() * 1.602176634e-19 * 6.02214076e23;
            return 0.4 * Q;
        }

        // Morse De
        if (atom.morseDeEv() != null) {
            double Q = atom.morseDeEv() * 1.602176634e-19 * 6.02214076e23;
            return 0.5 * Q;
        }

        // Энергия из температуры Дебая
        if (atom.DebyeTemperature() != null) {
            double kB = 1.380649e-23;
            return kB * atom.DebyeTemperature() * 5 * 6.02214076e23;
        }

        // fallback
        return 1e5;
    }
}
