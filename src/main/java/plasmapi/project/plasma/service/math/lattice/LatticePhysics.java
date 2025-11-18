package plasmapi.project.plasma.service.math.lattice;


import plasmapi.project.plasma.model.atom.StructureType;

public class LatticePhysics {

    public static double nnDistance(StructureType s, double a) {
        return switch (s) {
            case SC -> a;
            case BCC -> Math.sqrt(3.0) / 2.0 * a;
            case FCC -> Math.sqrt(2.0) / 2.0 * a;
            case HCP -> a; // for simplicity; real HCP depends on c/a
        };
    }

    public static double packingFactor(StructureType s) {
        return switch (s) {
            case SC -> 0.52;
            case BCC -> 0.68;
            case FCC -> 0.74;
            case HCP -> 0.74;
        };
    }

    public static double collisionStructureFactor(StructureType s) {
        return switch (s) {
            case SC -> 1.0;
            case BCC -> 1.08;
            case FCC -> 1.15;
            case HCP -> 1.18;
        };
    }

    public static double morseReFactor(StructureType type) {
        return switch (type) {
            case SC -> 1.0;
            case BCC -> 0.95;
            case FCC -> 0.90;
            case HCP -> 0.90;
        };
    }

    public static double diffusionStructureFactor(StructureType s) {
        return switch (s) {
            case SC -> 1.0;
            case BCC -> 0.9;
            case FCC -> 0.75;
            case HCP -> 0.7;
        };
    }

    public static double thermalConductivityFactor(StructureType s) {
        return switch (s) {
            case SC -> 1.0;
            case BCC -> 1.2;
            case FCC -> 1.35;
            case HCP -> 1.4;
        };
    }
}

