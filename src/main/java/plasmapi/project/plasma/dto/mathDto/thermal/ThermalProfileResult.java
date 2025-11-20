package plasmapi.project.plasma.dto.mathDto.thermal;

public record ThermalProfileResult(
        double Tmax,
        double[] tempsAtDepth,      // температура через depth nodes в момент Tmax (или final)
        double[] depths
) {}
