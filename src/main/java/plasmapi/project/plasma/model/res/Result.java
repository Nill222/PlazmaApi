package plasmapi.project.plasma.model.res;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.BatchSize;
import lombok.Data;
import lombok.NoArgsConstructor;
import plasmapi.project.plasma.model.atom.AtomList;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "results")
public class Result {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id")
    private Config config;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atom_list_id")
    private AtomList atom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ion_id")
    private Ion ion;

    @OneToMany(mappedBy = "result", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private List<ResultAtomComponent> atomComponents = new ArrayList<>();

    @OneToMany(mappedBy = "result", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    private List<ResultIonComponent> ionComponents = new ArrayList<>();

        // ------------------ Energy ---------------------

        @Column(name = "total_transferred_energy", nullable = false)
        private Double totalTransferredEnergy;

        @Column(name = "avg_transferred_per_atom", nullable = false)
        private Double avgTransferredPerAtom;

        // ------------------ Temperature ----------------

        @Column(name = "avg_t", nullable = false)
        private Double avgT;

        @Column(name = "min_t", nullable = false)
        private Double minT;

        @Column(name = "max_t", nullable = false)
        private Double maxT;

        // ------------------ Diffusion ------------------

        @Column(name = "diffusion_coefficient_1")
        private Double diffusionCoefficient1;

        @Column(name = "diffusion_coefficient_2")
        private Double diffusionCoefficient2;

        // ------------------ Plasma Parameters ----------

        @Column(name = "voltage")
        private Double voltage;

        @Column(name = "electron_temperature")
        private Double electronTemperature;

        @Column(name = "ion_energy")
        private Double ionEnergy;

        @Column(name = "pressure")
        private Double pressure;

        @Column(name = "electron_density")
        private Double electronDensity;

        @Column(name = "electron_velocity")
        private Double electronVelocity;

        @Column(name = "current_density")
        private Double currentDensity;

        // ------------------ Additional Physics ---------

        @Column(name = "depths")
        private Double depths;

        @Column(name = "concentration")
        private Double concentration;

        @Column(name = "d_thermal")
        private Double dThermal;

        @Column(name = "total_momentum")
        private Double totalMomentum;

        @Column(name = "total_damage")
        private Double totalDamage;

        @Column(name = "total_displacement")
        private Double totalDisplacement;

        @Column(name = "fluence")
        private Double fluence;

        @Column(name = "fluence_eff")
        private Double fluenceEff;

        @Column(name = "ion_flux")
        private Double ionFlux;

        @Column(name = "resonance_xi")
        private Double resonanceXi;

        @Column(name = "d_slr")
        private Double dSlr;

        @Column(name = "d_res")
        private Double dRes;

        // ------------------ Intermediate: energy deposition / SKIN ---------

        @Column(name = "potential_at_surface")
        private Double potentialAtSurface;

        @Column(name = "accelerating_field")
        private Double acceleratingField;

        @Column(name = "energy_gain_factor")
        private Double energyGainFactor;

        @Column(name = "plasma_correction_factor")
        private Double plasmaCorrectionFactor;

        @Column(name = "exposure_rate")
        private Double exposureRate;

        @Column(name = "modified_layer_thickness")
        private Double modifiedLayerThickness;

        @Column(name = "skin_depth")
        private Double skinDepth;

        @Column(name = "skin_surface_power")
        private Double skinSurfacePower;

        @Column(name = "skin_accumulated_energy")
        private Double skinAccumulatedEnergy;

        @Column(name = "skin_temperature_delta")
        private Double skinTemperatureDelta;

        @Column(name = "effective_surface_temperature")
        private Double effectiveSurfaceTemperature;

        // ------------------ Intermediate: thermal --------------------------

        @Column(name = "final_probe_temperature")
        private Double finalProbeTemperature;

        @Column(name = "debye_front_speed")
        private Double debyeFrontSpeed;

        @Column(name = "debye_front_depth")
        private Double debyeFrontDepth;

        // ------------------ Intermediate: diffusion / transport -----------

        @Column(name = "d_radiation")
        private Double dRadiation;

        @Column(name = "d_collision")
        private Double dCollision;

        @Column(name = "slr_factor")
        private Double slrFactor;

        @Column(name = "damage_rate")
        private Double damageRate;

        @Column(name = "projected_range")
        private Double projectedRange;

        @Column(name = "straggle_sigma")
        private Double straggleSigma;

        @Column(name = "lattice_stiffness")
        private Double latticeStiffness;

        @Column(name = "equilibrium_distance")
        private Double equilibriumDistance;

        /** Угол падения иона на мишень, ° */
        @Column(name = "ion_incidence_angle")
        private Double ionIncidenceAngle;

        /** Расстояние анод–катод (зазор разряда), м */
        @Column(name = "electrode_distance")
        private Double electrodeDistance;

        @Column(name = "created_at")
        private LocalDateTime createdAt = LocalDateTime.now();

        @PrePersist
        protected void onCreate() {
            createdAt = LocalDateTime.now();
        }
}
