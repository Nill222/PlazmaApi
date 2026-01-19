package plasmapi.project.plasma.dto.mathDto.collision;

import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.atom.StructureType;

public record CollisionDto(
        Double distance,                // фактическое расстояние (м), может быть null → используем nn
        double latticeParameter,        // параметр решётки (м)
        double angle,                   // угол падения (градусы)
        double E,                       // энергия иона (Дж)
        double mIon,                    // масса иона (кг)
        double mAtom,                   // масса атома мишени (кг)
        Double xi,                      // резонансный множитель ξ
        Double surfaceBindingEnergy,    // энергия связи на поверхности (Дж)
        StructureType structure,        // тип кристаллической структуры (FCC, BCC, HCP)
        AtomList atom,                   // атомные параметры для выбора потенциала
        Double ionFlux
) {
}
