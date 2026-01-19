package plasmapi.project.plasma.dto.logikDTO;

import plasmapi.project.plasma.dto.logikDTO.atom.AtomListDTO;
import plasmapi.project.plasma.dto.logikDTO.config.ConfigDTO;
import plasmapi.project.plasma.dto.logikDTO.ion.IonDTO;

import java.time.LocalDateTime;

public record ResultDTO(
        Integer id,
        ConfigDTO config,
        IonDTO ion,
        AtomListDTO atom,
        double totalTransferredEnergy,
        double avgTransferredPerAtom,
        double avgT,
        double minT,
        double maxT,
        double diffusionCoefficient1,
        double diffusionCoefficient2,
        double voltage,
        double electronTemperature,
        double ionEnergy,
        double pressure,
        double electronDensity,
        double electronVelocity,
        double currentDensity,
        double depths,
        double concentration,
        double dThermal,
        double totalMomentum,
        double totalDamage,
        double totalDisplacement,
        LocalDateTime createdAt,
        double current
) {}



