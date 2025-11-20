package plasmapi.project.plasma.service.math.plazma;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaParameters;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaRequestDto;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.repository.PlasmaConfigurationRepository;


@Service
@RequiredArgsConstructor
public class PlasmaServiceImpl implements PlasmaService {

    private final PlasmaConfigurationRepository plasmaConfigRepo;

    private static final double KB = 1.380649e-23;
    private static final double E_CHARGE = 1.602176634e-19;
    private static final double ME = 9.10938356e-31;

    @Override
    public PlasmaParameters calculate(PlasmaRequestDto dto) {
        PlasmaConfiguration pc = plasmaConfigRepo.findByConfigId(dto.configId())
                .orElseThrow(() -> new IllegalArgumentException("Plasma configuration not found"));

        double Te = safe(pc.getElectronTemperature(), 300.0);
        double p = safe(pc.getPressure(), 100.0);

        double ne = p / (KB * Te);
        double voltage = safe(pc.getVoltage(), 1000.0);
        double current = safe(pc.getCurrent(), 0.1);

        double ve = Math.sqrt(2.0 * E_CHARGE * voltage / ME);

        // chamber volume (cylinder)
        double radius = safe(pc.getChamberWidth(), 0.1) / 2.0;
        double height = safe(pc.getChamberHeight(), 0.2);
        double V = Math.PI * radius * radius * height;

        double ionEnergy;
        if (pc.getIonEnergyOverride() != null && pc.getIonEnergyOverride() > 0) {
            ionEnergy = pc.getIonEnergyOverride();
        } else {
            double exposure = safe(pc.getExposureTime(), 1.0);
            ionEnergy = (voltage * current * exposure) / (ne * V);
        }

        PlasmaParameters res = new PlasmaParameters(ne, ve, ionEnergy, voltage, p, Te);
        return res;
    }

    private double safe(Double v, double fallback) {
        return v != null ? v : fallback;
    }
}
