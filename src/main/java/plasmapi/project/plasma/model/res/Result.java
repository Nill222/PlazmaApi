package plasmapi.project.plasma.model.res;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaResultDto;
import plasmapi.project.plasma.model.atom.AtomList;

import java.time.LocalDateTime;
import java.util.List;

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

        @Column(name = "created_at")
        private LocalDateTime createdAt = LocalDateTime.now();

        @PrePersist
        protected void onCreate() {
            createdAt = LocalDateTime.now();
        }
}
