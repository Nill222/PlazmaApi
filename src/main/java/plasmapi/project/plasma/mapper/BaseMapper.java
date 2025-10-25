package plasmapi.project.plasma.mapper;

import plasmapi.project.plasma.dto.logikDTO.ion.IonDTO;
import plasmapi.project.plasma.model.res.Ion;

public interface BaseMapper<T, F> {
    T map(F object);

    default T map(F fromObject, T toObject) {
        return toObject;
    }
}
