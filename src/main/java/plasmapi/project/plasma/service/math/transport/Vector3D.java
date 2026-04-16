package plasmapi.project.plasma.service.math.transport;

public class Vector3D {

    private final double x;
    private final double y;
    private final double z;

    // =========================
    // CONSTRUCTOR
    // =========================
    public Vector3D(double x, double y, double z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // =========================
    // GETTERS
    // =========================
    public double getX() { return x; }
    public double getY() { return y; }
    public double getZ() { return z; }

    // =========================
    // BASIC OPERATIONS
    // =========================
    public Vector3D add(Vector3D v) {
        return new Vector3D(
                this.x + v.x,
                this.y + v.y,
                this.z + v.z
        );
    }

    public Vector3D subtract(Vector3D v) {
        return new Vector3D(
                this.x - v.x,
                this.y - v.y,
                this.z - v.z
        );
    }

    public Vector3D scale(double k) {
        return new Vector3D(
                this.x * k,
                this.y * k,
                this.z * k
        );
    }

    // =========================
    // DOT & CROSS
    // =========================
    public double dot(Vector3D v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    public Vector3D cross(Vector3D v) {
        return new Vector3D(
                this.y * v.z - this.z * v.y,
                this.z * v.x - this.x * v.z,
                this.x * v.y - this.y * v.x
        );
    }

    // =========================
    // MAGNITUDE
    // =========================
    public double magnitude() {
        return Math.sqrt(x * x + y * y + z * z);
    }

    public double magnitudeSquared() {
        return x * x + y * y + z * z;
    }

    // =========================
    // NORMALIZATION
    // =========================
    public Vector3D normalize() {

        double mag = magnitude();

        if (mag < 1e-20) {
            // защита от деления на 0
            return new Vector3D(0, 0, 1);
        }

        return new Vector3D(
                x / mag,
                y / mag,
                z / mag
        );
    }

    // =========================
    // ANGLE BETWEEN VECTORS
    // =========================
    public double angle(Vector3D v) {

        double dot = this.dot(v);
        double mags = this.magnitude() * v.magnitude();

        if (mags < 1e-20) return 0;

        double cos = dot / mags;

        // численная стабильность
        cos = Math.max(-1.0, Math.min(1.0, cos));

        return Math.acos(cos);
    }

    // =========================
    // UTILS
    // =========================
    @Override
    public String toString() {
        return "Vector3D{" +
                "x=" + x +
                ", y=" + y +
                ", z=" + z +
                '}';
    }
}