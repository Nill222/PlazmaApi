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

                atom.getCohesiveEnergyEv1(),
                atom.getCohesiveEnergyEv2(),
                atom.getScreeningLength(),
                atom.getPackingFactor1(),
                atom.getPackingFactor2()
        );
    }

    @Override
    public ThermalDto getThermalInput(Integer configId, Integer atomListId, double exposureTime, double electronTemp) {
        AtomList atom = atomListRepo.findById(atomListId)
                .orElseThrow(() -> new IllegalArgumentException("AtomList not found"));

        PlasmaConfiguration pc = plasmaConfigRepo.findByConfigId(configId).orElse(null);

        double density = (atom.getMass() != null) ? atom.getMass() * 1000 : 7874.0; // fallback kg/m3
        double thickness = (pc != null && pc.getChamberWidth() != null) ? pc.getChamberWidth() * 1e-2 : 1e-6;
        double area = (pc != null && pc.getChamberDepth() != null) ? pc.getChamberDepth() * 1e-2 : 1e-4;
        double lambda0 = (pc != null && pc.getThermalConductivity() != null) ? pc.getThermalConductivity() : 50.0;

        double ionEnergyEffective = (pc != null) ? safe(pc.getIonEnergyOverride(), 0.0) : 0.0;

        return new ThermalDto(
                electronTemp,                       // T0
                exposureTime,                 // tMax
                exposureTime / 200.0,         // dt
                density,
                thickness,
                area,
                lambda0,
                atom.getDebyeTemperature(),
                (atom.getMass() != null) ? atom.getMass() * 6.02214076e23 : 55.845e-3,
                atom.getStructure(),
                null,                         // potential
                atom,
                ionEnergyEffective,           // ionEnergy from plasma
                exposureTime,
                null,
                null,
                300.0
        );
    }

    @Override
    public CollisionDto getCollisionInput(Integer atomListId, double distance, double ionEnergy, double angle, double ionFlux) {
        AtomList atom = atomListRepo.findById(atomListId)
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
                atom,
                ionFlux

        );
    }

    // ------------------------ helpers ------------------------
    private double safe(Double v, double fallback) {
        return v != null ? v : fallback;
    }
}
