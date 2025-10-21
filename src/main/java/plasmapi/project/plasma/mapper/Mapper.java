package plasmapi.project.plasma.mapper;

import org.springframework.stereotype.Component;
import plasmapi.project.plasma.dto.logikDTO.*;
import plasmapi.project.plasma.model.atom.Atom;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Config;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.model.security.User;

@Component
public class Mapper {

    public UserDTO toDTO(User user) {
        return new UserDTO(user.getId(), user.getUsername(), user.getEmail(), user.getRole());
    }

    public static AtomListDTO toDTO(AtomList atomList) {
        return new AtomListDTO(atomList.getId(), atomList.getAtomName(), atomList.getFullName(),
                atomList.getMass(), atomList.getA(), atomList.getDebyeTemperature(), atomList.getValence());
    }

    public AtomDTO toDTO(Atom atom) {
        return new AtomDTO(atom.getId(), toDTO(atom.getAtomList()), atom.getX(), atom.getY(), atom.getVx(), atom.getVy());
    }

    public ConfigDTO toDTO(Config config) {
        return new ConfigDTO(config.getId(), config.getName(), config.getDescription(),
                config.getCreatedAt(), toDTO(config.getUser()));
    }

    public IonDTO toDTO(Ion ion) {
        return new IonDTO(ion.getId(), ion.getName(), ion.getMass(), ion.getCharge());
    }

    public ResultDTO toDTO(Result result) {
        return new ResultDTO(result.getId(), toDTO(result.getIon()), result.getEnergy(),
                result.getPotential(), result.getTemperature(), result.getCreatedAt());
    }
}

