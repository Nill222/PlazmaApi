package plasmaApi.project.plasmaApi.service.logik;

import plasmaApi.project.plasmaApi.model.atom.Atom;
import plasmaApi.project.plasmaApi.model.atom.AtomList;

import java.util.List;
import java.util.Optional;

public interface AtomService extends MotherService<Atom, Integer>{
    List<Atom> getAtomsByConfig(Integer configId);

    List<AtomList> getAvailableAtoms();

    Optional<AtomList> getAtomProperties(String symbol);
}
