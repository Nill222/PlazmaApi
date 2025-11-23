package plasmapi.project.plasma.service.math.resonanse;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.atom.AtomListDto;
import plasmapi.project.plasma.dto.mathDto.resonance.ResonanceInputDto;
import plasmapi.project.plasma.service.math.simulation.SimulationService;

@Service
@RequiredArgsConstructor
public class ResonanceServiceImpl implements ResonanceService {

    private final SimulationService simulationService;

    private static final double KB = 1.380649e-23;
    private static final double HBAR = 1.054571817e-34;

    @Override
    public double computeXi(Integer atomListId, ResonanceInputDto in) {
        AtomListDto atom = simulationService.getAtomList(atomListId);
        if (atom == null) return 1.0;

        double omegaExt = in != null && in.omegaExt() != null ? in.omegaExt() : 1e6;
        double omega0 = in != null && in.omega0() != null
                ? in.omega0()
                : (atom.DebyeTemperature() != null ? KB * atom.DebyeTemperature() / HBAR : 1e6);
        double xiEmp = in != null && in.xiEmp() != null ? in.xiEmp() : 1.0;
        double psi = in != null && in.psi() != null ? in.psi() : 1e-3;

        if (omega0 <= 0 || omegaExt <= 0) return 1.0;

        double r = omegaExt / omega0;
        double denom = (r - 1.0)*(r - 1.0) + psi*psi;
        double add = xiEmp * r / denom;

        return 1.0 + Math.min(add, 100.0);
    }
}
