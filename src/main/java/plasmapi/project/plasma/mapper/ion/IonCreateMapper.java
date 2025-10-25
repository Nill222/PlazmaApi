package plasmapi.project.plasma.mapper.ion;

import org.springframework.stereotype.Component;
import plasmapi.project.plasma.dto.logikDTO.ion.CreateIonDTO;
import plasmapi.project.plasma.mapper.BaseMapper;
import plasmapi.project.plasma.model.res.Ion;

@Component
public class IonCreateMapper implements BaseMapper<Ion, CreateIonDTO> {

    @Override
    public Ion map(CreateIonDTO dto) {
        Ion ion = new Ion();
        copy(dto, ion);
        return ion;
    }

    @Override
    public Ion map(CreateIonDTO dto, Ion ion) {
        copy(dto, ion);
        return ion;
    }

    private void copy(CreateIonDTO dto, Ion ion) {
        ion.setName(dto.name());
        ion.setMass(dto.mass());
        ion.setCharge(dto.charge());
    }
}
