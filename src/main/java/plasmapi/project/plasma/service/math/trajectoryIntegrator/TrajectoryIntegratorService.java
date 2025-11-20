package plasmapi.project.plasma.service.math.trajectoryIntegrator;

import plasmapi.project.plasma.dto.mathDto.trajectory.TrajectoryDto;
import plasmapi.project.plasma.dto.mathDto.trajectory.Point3d;

public interface TrajectoryIntegratorService {
    TrajectoryDto integrate(Point3d start, Point3d end,
                            double voltage, double pressure,
                            double[] B, double ionMass, double ionCharge);
}
