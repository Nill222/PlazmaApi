package plasmapi.project.plasma.service;

public record PhysicsModelParameters(

    // collision
    double displacementEnergy_eV,
    double cascadeEfficiency,
    double electronicStoppingFactor,

    // transport
    double minEnergy_eV,
    double maxStep_m,
    double maxImpactParameterFactor,

    // diffusion coupling
    double radiationEfficiency,
    double srimWeight,
    double monteCarloWeight,

    // numerical stability
    double epsilon

) {}