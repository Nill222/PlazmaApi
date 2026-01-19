package plasmapi.project.plasma.service.math.optimization.impl;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.service.math.optimization.IonFluxService;

@Service
public class IonFluxServiceImpl implements IonFluxService {

    @Override
    public double computeLocalVelocity(double v0, double theta,
                                       double r, double Eion,
                                       double fScreen, double gamma0,
                                       double k, double p,
                                       double beta, double r0) {
        // γ = γ0 + k*p
        double gamma = gamma0 + k * p;

        // fr(r) = (1 + r/r0)^(-β)
        double fr = Math.pow(1.0 + r / r0, -p);

        // v_loc = v0 * cos(theta)^γ * fr(r) * Eion * fScreen
        double vLoc = v0 * Math.pow(Math.cos(theta), gamma) * fr * Eion * fScreen;
        return Math.max(0.0, vLoc);
    }
}
