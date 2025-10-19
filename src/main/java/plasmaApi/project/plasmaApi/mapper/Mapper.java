package plasmaApi.project.plasmaApi.mapper;

import org.springframework.stereotype.Component;
import plasmaApi.project.plasmaApi.dto.logikDTO.*;
import plasmaApi.project.plasmaApi.model.atom.Atom;
import plasmaApi.project.plasmaApi.model.atom.AtomList;
import plasmaApi.project.plasmaApi.model.res.Config;
import plasmaApi.project.plasmaApi.model.res.Ion;
import plasmaApi.project.plasmaApi.model.res.Result;
import plasmaApi.project.plasmaApi.model.security.User;

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

