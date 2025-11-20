package plasmapi.project.plasma.dto.mathDto.thermal;

import plasmapi.project.plasma.model.atom.StructureType;

public record LocalHeatingRequest(
        double energyDeposited, // J на локальный объём (например, per atom or per area)
        double area,            // m^2 — площадь удара/точки
        double depth,           // m — глубина слоя (толщина прим: 1e-6)
        double rho,             // плотность, kg/m^3
        double cp,              // теплоёмкость, J/(kg*K)
        double kThermal,        // теплопроводность, W/(m*K)
        StructureType structure
) {}
