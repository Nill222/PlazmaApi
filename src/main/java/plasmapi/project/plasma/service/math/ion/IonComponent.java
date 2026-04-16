package plasmapi.project.plasma.service.math.ion;

import lombok.Getter;
import plasmapi.project.plasma.model.res.Ion;

@Getter
public class IonComponent {
    private final Ion ion;
    private final double fraction;

    public IonComponent(Ion ion, double fraction) {
        this.ion = ion;
        this.fraction = fraction;
    }

}