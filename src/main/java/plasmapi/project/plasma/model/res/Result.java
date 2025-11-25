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
        private double totalTransferredEnergy;

        @Column(name = "avg_transferred_per_atom", nullable = false)
        private double avgTransferredPerAtom;

        // ------------------ Temperature ----------------

        @Column(name = "avg_t", nullable = false)
        private double avgT;

        @Column(name = "min_t", nullable = false)
        private double minT;

        @Column(name = "max_t", nullable = false)
        private double maxT;

        // ------------------ Diffusion ------------------

        @Column(name = "diffusion_coefficient_1")
        private double diffusionCoefficient1;

        @Column(name = "diffusion_coefficient_2")
        private double diffusionCoefficient2;

        // ------------------ Plasma Parameters ----------

        @Column(name = "voltage")
        private double voltage;

        @Column(name = "electron_temperature")
        private double electronTemperature;

        @Column(name = "ion_energy")
        private double ionEnergy;

        @Column(name = "pressure")
        private double pressure;

        @Column(name = "electron_density")
        private double electronDensity;

        @Column(name = "electron_velocity")
        private double electronVelocity;

        @Column(name = "current_density")
        private double currentDensity;

        // ------------------ Additional Physics ---------

        @Column(name = "depths")
        private double depths;

        @Column(name = "concentration")
        private double concentration;

        @Column(name = "d_thermal")
        private double dThermal;

        @Column(name = "total_momentum")
        private double totalMomentum;

        @Column(name = "total_damage")
        private double totalDamage;

        @Column(name = "total_displacement")
        private double totalDisplacement;

        @Column(name = "created_at")
        private LocalDateTime createdAt = LocalDateTime.now();

        @PrePersist
        protected void onCreate() {
            createdAt = LocalDateTime.now();
        }
}
