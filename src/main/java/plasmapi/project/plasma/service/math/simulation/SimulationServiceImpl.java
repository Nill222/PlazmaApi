package plasmapi.project.plasma.service.math.simulation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.atom.AtomListDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaResultDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalDto;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.repository.AtomListRepository;
import plasmapi.project.plasma.repository.PlasmaConfigurationRepository;
import plasmapi.project.plasma.service.math.lattice.LatticePhysics;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;


@Service
@RequiredArgsConstructor
public class SimulationServiceImpl implements SimulationService {

    private final PlasmaConfigurationRepository plasmaConfigRepo;
    private final AtomListRepository atomListRepo;
    private final PlasmaService plasmaService;

    @Override
    public PlasmaResultDto getPlasmaParametersFromRequest(SimulationRequestDto request) {
        if (request == null) throw new IllegalArgumentException("SimulationRequestDto required");

        // Делегируем вычисления PlasmaService
        return plasmaService.calculate(request);
    }

    @Override
    public AtomListDto getAtomList(Integer atomListId) {
        if (atomListId == null) throw new IllegalArgumentException("atomListId required");

        AtomList atom = atomListRepo.findById(atomListId)
                .orElseThrow(() -> new IllegalArgumentException("AtomList not found"));

        return new AtomListDto(
                atom.getId(),
                atom.getAtomName(),
                atom.getFullName(),
                atom.getMass(),
                atom.getA(),
                atom.getDebyeTemperature(),
                atom.getValence(),
                atom.getStructure(),
                atom.getMorseDeEv(),
                atom.getMorseA(),
                atom.getLjSigma(),
                atom.getLjEpsilonEv(),
                atom.getBornMayerA(),
                atom.getCohesiveEnergyEv(),
                atom.getBornMayerAParam(),
                atom.getScreeningLength(),
                atom.getPackingFactor(),
                atom.getNotes()
        );
    }

    @Override
    public ThermalDto getThermalInput(
            SimulationRequestDto dto,
            Integer configId,
            Integer atomListId,
            double exposureTime
    ) {
        AtomList atom = atomListRepo.findById(dto.atomId())
                .orElseThrow(() -> new IllegalArgumentException("AtomList not found"));

        PlasmaConfiguration pc = plasmaConfigRepo.findByConfigId(dto.configId())
                .orElseThrow(() -> new IllegalArgumentException("PlasmaConfiguration not found"));

        // --- ПОЛЯ, ПРИХОДЯЩИЕ ОТ ПОЛЬЗОВАТЕЛЯ ---
        double initialTemperature = dto.electronTemperature();
        double tMax = dto.exposureTime();
        double dt = tMax / 200.0;

        // --- ИЗ БАЗЫ ДАННЫХ ---
        double thickness = (pc.getChamberWidth() != null)
                ? pc.getChamberWidth() * 1e-2     // см → м
                : 1e-6;

        double thermalConductivity = (pc.getThermalConductivity() != null)
                ? pc.getThermalConductivity()
                : 50.0;

        double ionEnergy = (pc.getIonEnergyOverride() != null)
                ? pc.getIonEnergyOverride()
                : 0.0;

        // --- Формируем ThermalDto для симуляции ---
        return new ThermalDto(
                initialTemperature,
                tMax,
                dt,
                thickness,
                thermalConductivity,
                ionEnergy
        );
    }


    @Override
    public CollisionDto getCollisionInput(SimulationRequestDto dto,Integer atomListId, double distance, double ionEnergy, double angle) {
        AtomList atom = atomListRepo.findById(dto.atomId())
                .orElseThrow(() -> new IllegalArgumentException("AtomList not found"));

        double aMeters = (atom.getA() != null ? atom.getA() : 2.86) * 1e-10;
        double nnDistance = (distance > 0) ? distance : LatticePhysics.nnDistance(atom.getStructure(), aMeters);

        double mIon = 1.67262192369e-27; // proton mass
        double mAtom = (atom.getMass() != null) ? atom.getMass() : 55.845 * 1.66053906660e-27;

        double surfaceBindingEnergy = 3.0 * 1.602176634e-19;

        return new CollisionDto(
                nnDistance,
                aMeters,
                angle,
                ionEnergy,                   // теперь учитываем энергию из плазмы
                mIon,
                mAtom,
                1.0,
                surfaceBindingEnergy,
                atom.getStructure(),
                atom
        );
    }

    // ------------------------ helpers ------------------------
    private double safe(Double v, double fallback) {
        return v != null ? v : fallback;
    }
}
