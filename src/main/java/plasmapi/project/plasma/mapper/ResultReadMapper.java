package plasmapi.project.plasma.mapper;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import plasmapi.project.plasma.dto.logikDTO.ResultDTO;
import plasmapi.project.plasma.dto.logikDTO.config.ConfigDTO;
import plasmapi.project.plasma.dto.logikDTO.ion.IonDTO;
import plasmapi.project.plasma.dto.logikDTO.user.UserDTO;
import plasmapi.project.plasma.model.res.Config;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.model.security.User;
import plasmapi.project.plasma.repository.PlasmaConfigurationRepository;

@Component
@RequiredArgsConstructor
public class ResultReadMapper implements BaseMapper<ResultDTO, Result>{

    @Override
    public ResultDTO map(Result result) {
        return new ResultDTO(
                result.getId(),
                mapConfig(result.getConfig()),
                mapIon(result.getIon()),
                result.getEnergy(),
                result.getPotential(),
                result.getTemperature(),
                result.getCreatedAt()
        );
    }

    private ConfigDTO mapConfig(Config config) {
        if (config == null) return null;
        return new ConfigDTO(
                config.getId(),
                config.getName(),
                config.getDescription(),
                config.getCreatedAt(),
                mapUser(config.getUser())
        );
    }



    private IonDTO mapIon(Ion ion) {
        if (ion == null) return null;
        return new IonDTO(
                ion.getId(),
                ion.getName(),
                ion.getMass(),
                ion.getCharge()
        );
    }

    private UserDTO mapUser(User user) {
        if (user == null) return null;
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole()
        );
    }
}
