package plasmapi.project.plasma.mapper.ion;

import org.springframework.stereotype.Component;
import plasmapi.project.plasma.dto.logikDTO.ion.IonDTO;
import plasmapi.project.plasma.mapper.BaseMapper;
import plasmapi.project.plasma.model.res.Ion;

@Component
public class IonReadMapper implements BaseMapper<IonDTO, Ion> {

    @Override
    public IonDTO map(Ion ion) {
        return new IonDTO(
                ion.getId(),
                ion.getName(),
                ion.getMass(),
                ion.getCharge()
        );
    }
}
