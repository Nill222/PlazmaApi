package plasmapi.project.plasma.service.math.resonanse;


import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.resonance.ResonanceInputDto;
import plasmapi.project.plasma.model.atom.AtomList;

@Service
public class ResonanceServiceImpl implements ResonanceService {

    @Override
    public double computeXi(ResonanceInputDto in, AtomList atomType) {
        if (in == null || in.omegaExt() == null) return 1.0;
        double omegaExt = in.omegaExt();
        double omega0 = in.omega0() != null ? in.omega0() : estimateOmega0(atomType);
        double xiEmp = in.xiEmp() != null ? in.xiEmp() : 1.0;
        double psi = in.psi() != null ? in.psi() : 1e-3;

        if (omega0 <= 0 || omegaExt <= 0) return 1.0;
        double r = omegaExt / omega0;
        double denom = (r - 1.0) * (r - 1.0) + psi * psi;
        double add = xiEmp * r / denom;
        // clip to reasonable bounds
        double xi = 1.0 + Math.min(add, 100.0);
        return xi;
    }

    private double estimateOmega0(AtomList atom) {
        // Оценим по Debye (если есть), иначе по a и массе: omega ~ sqrt(k/m)
        if (atom == null) return 1e6;
        if (atom.getDebyeTemperature() != null && atom.getDebyeTemperature() > 0) {
            double thetaD = atom.getDebyeTemperature();
            // Debye T -> omega_D ~ k_B * T_D / hbar
            double kB = 1.380649e-23;
            double hbar = 1.054571817e-34;
            return kB * thetaD / hbar;
        }
        // fallback: use simple scale
        return 1e6; // 1 MHz default
    }
}
