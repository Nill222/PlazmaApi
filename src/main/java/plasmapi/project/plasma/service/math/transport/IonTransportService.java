package plasmapi.project.plasma.service.math.transport;

import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;

public interface IonTransportService {

    TransportResult simulate(
            Ion ion,
            AtomList atom,
            double ionEnergyEv,
            int particles
    );
}
