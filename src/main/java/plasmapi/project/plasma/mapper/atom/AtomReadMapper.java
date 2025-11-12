package plasmapi.project.plasma.mapper.atom;

import org.springframework.stereotype.Component;
import plasmapi.project.plasma.dto.logikDTO.atom.AtomDTO;
import plasmapi.project.plasma.dto.logikDTO.atom.AtomListDTO;
import plasmapi.project.plasma.dto.logikDTO.config.ConfigDTO;
import plasmapi.project.plasma.dto.logikDTO.user.UserDTO;
import plasmapi.project.plasma.mapper.BaseMapper;
import plasmapi.project.plasma.model.atom.Atom;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Config;
import plasmapi.project.plasma.model.security.User;

@Component
public class AtomReadMapper implements BaseMapper<AtomDTO, Atom> {

    @Override
    public AtomDTO map(Atom atom) {
        return new AtomDTO(
                atom.getId(),
                mapConfig(atom.getConfig()),
                mapAtomList(atom.getAtomList()),
                atom.getX(),
                atom.getY(),
                atom.getVx(),
                atom.getVy()
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

    private UserDTO mapUser(User user) {
        if (user == null) return null;
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole()
        );
    }

    private AtomListDTO mapAtomList(AtomList atomList) {
        if (atomList == null) return null;
        return new AtomListDTO(
                atomList.getId(),
                atomList.getAtomName(),
                atomList.getFullName(),
                atomList.getMass(),
                atomList.getA(),
                atomList.getDebyeTemperature(),
                atomList.getValence(),
                atomList.getStructure()
        );
    }
}

