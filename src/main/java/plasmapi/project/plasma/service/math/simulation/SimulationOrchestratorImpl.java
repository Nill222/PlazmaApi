package plasmapi.project.plasma.service.math.simulation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.atom.AtomListDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto; // <- если есть у вас
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.lattice.AtomDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaResultDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalDto;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalResultDto;
import plasmapi.project.plasma.service.math.collision.CollisionService;
import plasmapi.project.plasma.service.math.diffusion.DiffusionService;
import plasmapi.project.plasma.service.math.lattice.LatticeService;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;
import plasmapi.project.plasma.service.math.thermal.ThermalService;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SimulationOrchestratorImpl implements SimulationOrchestratorService {

    private final PlasmaService plasmaService;
    private final ThermalService thermalService;
    private final CollisionService collisionService;
    private final DiffusionService diffusionService;
    private final LatticeService latticeService;
    private final SimulationService simulationService;

    @Override
    public SimulationResultDto runSimulation(SimulationRequestDto request) {

        // ===== Получаем атомный список =====
        AtomListDto atom = simulationService.getAtomList(request.ionId());

        // ===== Генерация решётки =====
        List<AtomDto> lattice = latticeService.generateLattice(request.ionId(), 1000);

        // ===== Параметры плазмы =====
        PlasmaResultDto plasma = plasmaService.calculate(request);

        // ===== Тепловая симуляция =====
        ThermalDto thermalInput = simulationService.getThermalInput(
                request.configId(), request.ionId(), request.exposureTime()
        );
        ThermalResultDto thermalResult = thermalService.simulateCooling(thermalInput);

        // ===== Коллизии для всех атомов =====
        double totalTransferred = 0.0;
        double totalMomentum = 0.0;
        double totalDamage = 0.0;
        double totalDisplacement = 0.0;
        List<Double> perAtomTransferred = new ArrayList<>();

        for (AtomDto latticeAtom : lattice) {
            CollisionDto collisionInput = simulationService.getCollisionInput(
                    request.ionId(),
                    1e-9,
                    plasma.ionEnergy(),
                    0.0
            );
            CollisionResult colRes = collisionService.simulate(collisionInput);

            totalTransferred += colRes.transferredEnergy();
            totalMomentum += colRes.momentum();
            totalDamage += colRes.damageEnergy();
            totalDisplacement += colRes.displacement();
            perAtomTransferred.add(colRes.transferredEnergy());
        }

        // ===== Средние значения =====
        double avgTransferred = totalTransferred / lattice.size();
        double avgMomentum = totalMomentum / lattice.size();
        double avgDamage = totalDamage / lattice.size();
        double avgDisplacement = totalDisplacement / lattice.size();

        // ===== Диффузия =====
        DiffusionProfileDto diffusion = diffusionService.calculateFromConfig(
                request, request.ionId(), request.atomId(), request.exposureTime()
        );

        // ===== Средняя температура =====
        double avgTemperature = thermalResult.temperatures().stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(request.exposureTime());

        // ===== Собираем результат =====
        return new SimulationResultDto(
                "Ion-" + request.ionId(),
                "Atom-" + request.atomId(),
                totalTransferred,
                avgTransferred,
                avgTemperature,
                0.0,                  // можно добавить diffusion.meanDiffusionCoefficient()
                plasma,
                perAtomTransferred,
                diffusion,
                thermalResult.temperatures()
        );
    }
}
