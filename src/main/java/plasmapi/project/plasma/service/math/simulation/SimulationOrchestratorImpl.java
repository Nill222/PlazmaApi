package plasmapi.project.plasma.service.math.simulation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.atom.AtomListDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
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

        // ===== Получаем атом =====
        AtomListDto atom = simulationService.getAtomList(request.atomId());

        // ===== Генерация решётки =====
        List<AtomDto> lattice = latticeService.generateLattice(request.atomId(), 1000);

        // ===== Плазма =====
        PlasmaResultDto plasma = plasmaService.calculate(request);

        // ===== Тепловая модель =====
        ThermalDto thermalInput = simulationService.getThermalInput(
                request.configId(),
                request.atomId(),
                request.exposureTime(),
                request.electronTemperature()
        );
        ThermalResultDto thermal = thermalService.simulateCooling(thermalInput);

        List<Double> Tlist = thermal.temperatures();

        double avgT = Tlist.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double minT = Tlist.stream().mapToDouble(Double::doubleValue).min().orElse(0);
        double maxT = Tlist.stream().mapToDouble(Double::doubleValue).max().orElse(0);

        // ===== Коллизии =====
        double totalTransferred = 0.0;
        double totalMomentum = 0.0;
        double totalDamage = 0.0;
        double totalDisplacement = 0.0;

        List<Double> perAtomTransferred = new ArrayList<>();

        for (AtomDto latticeAtom : lattice) {

            CollisionDto colInput = simulationService.getCollisionInput(
                    request.atomId(),
                    1e-9,                     // расстояние
                    plasma.ionEnergy(),       // E иона из плазмы
                    request.angle(),                       // угол или доп. параметр
                    plasma.ionFlux()
            );

            CollisionResult col = collisionService.simulate(colInput);

            totalTransferred += col.transferredEnergy();
            totalMomentum += col.momentum();
            totalDamage += col.damageEnergy();
            totalDisplacement += col.displacement();

            perAtomTransferred.add(col.transferredEnergy());
        }

        double avgTransferred = totalTransferred / lattice.size();

        // ===== Диффузия =====
        DiffusionProfileDto diffusion = diffusionService.calculateFromConfig(
                request,
                request.ionId(),
                request.atomId(),
                request.exposureTime(),
                request.electronTemperature(),
                plasma.ionEnergy()
        );

        // ===== Итог =====
        return new SimulationResultDto(
                request.atomId(),
                request.configId(),
                request.ionId(),
                "Atom-" + atom.atomName(),
                "Ion-" + request.ionId(),
                totalTransferred,
                avgTransferred,
                avgT,    // средняя температура
                minT,    // минимальная температура
                maxT,    // максимальная температура
                diffusion.D1(),
                diffusion.D2(),
                plasma,
                perAtomTransferred,
                diffusion,
                Tlist,
                totalMomentum,
                totalDamage,
                totalDisplacement
        );
    }
}
