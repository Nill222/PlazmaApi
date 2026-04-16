package plasmapi.project.plasma.service.math.ion;

import lombok.Getter;

import java.util.List;

@Getter
public class IonComposition {
    private final List<IonComponent> components;

    public IonComposition(List<IonComponent> components) {
        this.components = components;
    }
}