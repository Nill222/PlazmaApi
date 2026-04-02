package plasmapi.project.plasma.service.math.ion;

import java.util.List;

public class IonComposition {
    private final List<IonComponent> components;

    public IonComposition(List<IonComponent> components) {
        this.components = components;
    }

    public List<IonComponent> getComponents() {
        return components;
    }
}