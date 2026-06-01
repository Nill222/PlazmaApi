package plasmapi.project.plasma.service.math.transport;

/**
 * Электрическое и магнитное поле для силы Лоренца F = q(E + v × B).
 */
public record LorentzContext(
        Vector3D electricField,
        Vector3D magneticField,
        boolean active
) {

    private static final double MIN_FIELD = 1e-15;

    public static LorentzContext disabled() {
        return new LorentzContext(Vector3D.ZERO, Vector3D.ZERO, false);
    }

    /**
     * E вдоль оси z (направление вглубь мишени), B — рассчитанное магнитное поле (Тл).
     */
    public static LorentzContext from(double acceleratingFieldVm, Vector3D magneticField) {
        Vector3D b = magneticField != null ? magneticField : Vector3D.ZERO;
        double eAccel = Math.max(acceleratingFieldVm, 0.0);
        Vector3D e = new Vector3D(0.0, 0.0, eAccel);
        boolean active = b.magnitude() > MIN_FIELD;
        return new LorentzContext(e, b, active);
    }

    public double magneticFieldMagnitude() {
        return magneticField.magnitude();
    }
}
