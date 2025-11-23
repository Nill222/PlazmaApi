package plasmapi.project.plasma.dto.mathDto.thermal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.atom.StructureType;

public record ThermalDto(
        double initialTemperature,   // T0
        double tMax,                 // общее время нагрева
        double dt,                   // шаг по времени
        double thickness,            // толщина слоя
        double thermalConductivity,  // теплопроводность λ
        double ionEnergy             // энергия ионов от плазмы
) {}
