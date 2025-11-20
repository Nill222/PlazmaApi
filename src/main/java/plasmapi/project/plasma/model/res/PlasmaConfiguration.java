package plasmapi.project.plasma.model.res;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "plasma_configurations")
public class PlasmaConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;



    //Плазма
    private Double voltage;
    private Double current;
    private Double pressure;
    private Double electronTemperature;
    private Double ionTemperature;
    private Double exposureTime;

    //Геометрия камеры
    private Double chamberWidth;
    private Double chamberHeight;
    private Double chamberDepth;
    private Double electrodeDistance;

    private String chamberMaterial;

    //Параметры удара иона
    private Double ionEnergyOverride;
    private Double ionIncidenceAngle;
    private Double targetTemperature;
    private Double surfaceBindingEnergy;
    private Double surfaceRoughness;

    //Материал для тепла и диффузии
    private Double thermalConductivity;
    private Double heatCapacity;
    private Double density;
    private Double meltingPoint;
    private Double latticeParameterOverride;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id")
    private Config config;
}
