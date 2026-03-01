package plasmapi.project.plasma.service.math.thermal;

import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.math.thermal.impl.ThermalServiceImpl;


public interface ThermalService {
    ThermalResult simulate(
            PlasmaConfiguration plasmaConfig,
            double T0,
            double tMax,
            double dt,
            double thickness,
            Double powerInput,
            Double projectedRange,
            ThermalServiceImpl.BoundaryCondition boundaryCondition,
            double ambientTemp,
            double h,
            Integer N
    );
}
