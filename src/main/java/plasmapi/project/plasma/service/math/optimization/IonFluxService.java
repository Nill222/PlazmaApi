package plasmapi.project.plasma.service.math.optimization;

public interface IonFluxService {
    double computeLocalVelocity(double v0, double theta, double r, double Eion, double fScreen,
                                double gamma0, double k, double p, double beta, double r0);
}

