package plasmapi.project.plasma.mapper;

public interface BaseMapper<T, F> {
    T map(F object);

    default T map(F fromObject, T toObject) {
        return toObject;
    }
}
