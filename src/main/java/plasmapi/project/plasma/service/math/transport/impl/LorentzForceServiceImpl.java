package plasmapi.project.plasma.service.math.transport.impl;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.service.math.PhysicalConstants;
import plasmapi.project.plasma.service.math.PhysicsMath;
import plasmapi.project.plasma.service.math.transport.LorentzContext;
import plasmapi.project.plasma.service.math.transport.LorentzForceService;
import plasmapi.project.plasma.service.math.transport.Vector3D;

@Service
public class LorentzForceServiceImpl implements LorentzForceService {

    @Override
    public Vector3D advanceVelocity(
            Vector3D velocity,
            LorentzContext context,
            int chargeUnits,
            double massKg,
            double dt
    ) {
        if (!context.active() || dt <= 0 || velocity.magnitude() <= 0) {
            return velocity;
        }

        double mass = PhysicsMath.safeIonMassKg(massKg);
        int charge = PhysicsMath.safeIonCharge(chargeUnits);
        double qOverM = charge * PhysicalConstants.E_CHARGE / mass;

        Vector3D e = context.electricField();
        Vector3D b = context.magneticField();

        // Алгоритм Бориса: F = q(E + v × B)
        double halfDt = dt * 0.5;
        Vector3D vMinus = velocity.add(e.scale(qOverM * halfDt));

        Vector3D t = b.scale(qOverM * halfDt);
        double tMagSq = t.magnitudeSquared();
        Vector3D s = t.scale(2.0 / (1.0 + tMagSq));

        Vector3D vPlus = vMinus.add(vMinus.cross(s));
        return vPlus.add(e.scale(qOverM * halfDt));
    }

    @Override
    public double gyroradius(double speed, int chargeUnits, double massKg, double magneticFieldTesla) {
        if (speed <= 0 || magneticFieldTesla <= 0) {
            return 0.0;
        }
        double mass = PhysicsMath.safeIonMassKg(massKg);
        int charge = PhysicsMath.safeIonCharge(chargeUnits);
        double q = charge * PhysicalConstants.E_CHARGE;
        return mass * speed / (q * magneticFieldTesla);
    }
}
