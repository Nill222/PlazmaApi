package plasmapi.project.plasma.service.math.ion;

import plasmapi.project.plasma.model.res.Ion;

public class IonComponent {
    private final Ion ion;
    private final double fraction;

    public IonComponent(Ion ion, double fraction) {
        this.ion = ion;
        this.fraction = fraction;
    }

    public Ion getIon() { return ion; }
    public double getFraction() { return fraction; }
}