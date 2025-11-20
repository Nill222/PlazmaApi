package plasmapi.project.plasma.dto.mathDto.trajectory;

import java.util.List;

public record TrajectoryDto(
        List<Point3d> points,
        double arcLength,
        double integralWork
) {
}
