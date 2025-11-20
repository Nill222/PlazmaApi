package plasmapi.project.plasma.service.math.trajectoryIntegrator;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.trajectory.TrajectoryDto;
import plasmapi.project.plasma.dto.mathDto.trajectory.Point3d;

import java.util.ArrayList;
import java.util.List;

@Service
public class TrajectoryIntegratorImpl implements TrajectoryIntegratorService {

    private static final double eCharge = 1.602176634e-19;

    @Override
    public TrajectoryDto integrate(Point3d start, Point3d end,
                                   double voltage, double pressure,
                                   double[] B, double ionMass, double ionCharge) {
        // Простейшая аппроксимация: интегрируем Лоренца вдоль параметра времени.
        // Начальная скорость оцениваем из работы электрического поля: q*V -> E_kin = qV => v = sqrt(2 E / m)
        double q = ionCharge; // в кулонах
        double work = Math.abs(q * voltage); // Дж
        double v0 = Math.sqrt(2.0 * work / Math.max(1e-30, ionMass));

        // start position and velocity directed to end
        double dx = end.getX() - start.getX();
        double dy = end.getY() - start.getY();
        double dz = end.getZ() - start.getZ();
        double dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        double ux = dist > 0 ? dx/dist : 1.0;
        double uy = dist > 0 ? dy/dist : 0.0;
        double uz = dist > 0 ? dz/dist : 0.0;

        double vx = v0 * ux;
        double vy = v0 * uy;
        double vz = v0 * uz;

        double dt = 1e-9; // базовый шаг (подбирать адаптивно)
        int maxSteps = 10000;
        List<Point3d> pts = new ArrayList<>();
        pts.add(start);
        double arc = 0.0;
        double integralE = 0.0; // ∫ E·dl (approx = V if path connects electrodes)
        double[] pos = new double[]{start.getX(), start.getY(), start.getZ()};
        double[] vel = new double[]{vx, vy, vz};

        for (int step = 0; step < maxSteps; step++) {
            // compute E at pos (simple linear profile toward end)
            double[] Evec = computeEField(pos, start, end, voltage);
            double[] Bvec = B != null && B.length==3 ? B : new double[]{0,0,0};

            // acceleration a = q/m * (E + v x B)
            double[] a = lorentzAcc(vel, Evec, Bvec, q, ionMass);

            // RK4 position/velocity update (combine) - simplified: velocity Verlet / RK4 both work; use simple Euler-RK4 mix for MVP
            // For brevity — do simple explicit RK4 for vel and pos
            double[] k1v = a;
            double[] vtemp = new double[]{vel[0] + 0.5*dt*k1v[0], vel[1] + 0.5*dt*k1v[1], vel[2] + 0.5*dt*k1v[2]};
            double[] a2 = lorentzAcc(vtemp, Evec, Bvec, q, ionMass);
            double[] k2v = a2;
            double[] vtemp2 = new double[]{vel[0] + 0.5*dt*k2v[0], vel[1] + 0.5*dt*k2v[1], vel[2] + 0.5*dt*k2v[2]};
            double[] a3 = lorentzAcc(vtemp2, Evec, Bvec, q, ionMass);
            double[] k3v = a3;
            double[] vtemp3 = new double[]{vel[0] + dt*k3v[0], vel[1] + dt*k3v[1], vel[2] + dt*k3v[2]};
            double[] a4 = lorentzAcc(vtemp3, Evec, Bvec, q, ionMass);
            double[] k4v = a4;

            // update velocity
            vel[0] += dt*(k1v[0] + 2*k2v[0] + 2*k3v[0] + k4v[0]) / 6.0;
            vel[1] += dt*(k1v[1] + 2*k2v[1] + 2*k3v[1] + k4v[1]) / 6.0;
            vel[2] += dt*(k1v[2] + 2*k2v[2] + 2*k3v[2] + k4v[2]) / 6.0;

            // update position (simple Euler using updated vel)
            double[] newPos = new double[]{pos[0] + vel[0]*dt, pos[1] + vel[1]*dt, pos[2] + vel[2]*dt};
            double ds = Math.sqrt(Math.pow(newPos[0]-pos[0],2) + Math.pow(newPos[1]-pos[1],2) + Math.pow(newPos[2]-pos[2],2));
            arc += ds;
            integralE += dot(Evec, new double[]{newPos[0]-pos[0], newPos[1]-pos[1], newPos[2]-pos[2]});
            pos = newPos;
            pts.add(new Point3d(pos[0], pos[1], pos[2]));

            // termination: near end
            if (Math.sqrt(Math.pow(pos[0]-end.getX(),2)+Math.pow(pos[1]-end.getY(),2)+Math.pow(pos[2]-end.getZ(),2)) < 1e-6) break;
        }

        double integralWork = q * integralE;
        return new TrajectoryDto(pts, arc, integralWork);
    }

    private double[] computeEField(double[] pos, Point3d start, Point3d end, double voltage) {
        // Простейшая аппроксимация: E направлен вдоль вектора (end-start), модуль ~ V / L
        double vx = end.getX() - start.getX();
        double vy = end.getY() - start.getY();
        double vz = end.getZ() - start.getZ();
        double L = Math.sqrt(vx*vx + vy*vy + vz*vz);
        if (L == 0) return new double[]{0,0,0};
        double ex = vx / L * (voltage / Math.max(L, 1e-6));
        double ey = vy / L * (voltage / Math.max(L, 1e-6));
        double ez = vz / L * (voltage / Math.max(L, 1e-6));
        return new double[]{ex, ey, ez};
    }

    private double[] lorentzAcc(double[] v, double[] E, double[] B, double q, double m) {
        // a = q/m (E + v x B)
        double[] vxB = new double[]{
                v[1]*B[2] - v[2]*B[1],
                v[2]*B[0] - v[0]*B[2],
                v[0]*B[1] - v[1]*B[0]
        };
        return new double[]{ q/m*(E[0] + vxB[0]), q/m*(E[1] + vxB[1]), q/m*(E[2] + vxB[2]) };
    }

    private double dot(double[] a, double[] b) {
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
    }
}
