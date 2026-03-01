package plasmapi.project.plasma.model.atom;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "atom_list")
public class AtomList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "atom_name", nullable = false, length = 20)
    private String atomName;

    @Column(name = "full_name", length = 50)
    private String fullName;

    @Column(name = "u")
    private Double mass; // масса атома (кг)
    private Double a; // параметр решетки (Å)

    @Column(name = "debye_temperature")
    private Double debyeTemperature;

    private Integer valence; // валентность

    @Column(name = "atom_structure")
    @Enumerated(EnumType.STRING)
    private StructureType structure;

    @Column(name = "resonance_energy")
    private Double resonanceEnergy; // эВ

    @Column(name = "resonance_width")
    private Double resonanceWidth;   // эВ

    @Column(name = "resonance_amplitude")
    private Double resonanceAmplitude; // безразмерная


    @Column(name = "cohesive_energy_ev1")
    private Double cohesiveEnergyEv1;

    @Column(name = "cohesive_energy_ev2")
    private Double cohesiveEnergyEv2;

    /**
     * Экранная длина (м) для screened coulomb / Yukawa (если NULL — heuristic fraction of a).
     */
    @Column(name = "screening_length")
    private Double screeningLength;

    /**
     * Параметр паковки/фактора, при необходимости переопределить (если NULL — берётся из LatticePhysics).
     */
    @Column(name = "packing_factor1")
    private Double packingFactor1;

    @Column(name = "packing_factor2")
    private Double packingFactor2;
}
