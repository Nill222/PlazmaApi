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

    /**
     * Morse potential: D_e (в эВ). Если NULL — будет использовано приближение по cohesiveEnergy.
     */
    @Column(name = "morse_De_ev")
    private Double morseDeEv;

    /**
     * Morse potential: a (1/м). Если NULL — будет использована эвристика.
     */
    @Column(name = "morse_a")
    private Double morseA;

    /**
     * Lennard-Jones sigma (м). Если NULL — вычисляется из a.
     */
    @Column(name = "lj_sigma")
    private Double ljSigma;

    /**
     * Lennard-Jones epsilon (эВ). Если NULL — heuristic.
     */
    @Column(name = "lj_epsilon_ev")
    private Double ljEpsilonEv;

    /**
     * Born-Mayer A parameter (Дж) — предэкспоненциальный множитель.
     */
    @Column(name = "bm_A")
    private Double bornMayerA;

    /**
     * Born-Mayer screening length a_BM (м)
     */
    @Column(name = "bm_param")
    private Double bornMayerAParam;

    /**
     * Cohesive energy (связи в кристалле), эВ на атом (если есть).
     */
    @Column(name = "cohesive_energy_ev")
    private Double cohesiveEnergyEv;

    /**
     * Экранная длина (м) для screened coulomb / Yukawa (если NULL — heuristic fraction of a).
     */
    @Column(name = "screening_length")
    private Double screeningLength;

    /**
     * Параметр паковки/фактора, при необходимости переопределить (если NULL — берётся из LatticePhysics).
     */
    @Column(name = "packing_factor")
    private Double packingFactor;

    /**
     * Любые дополнительные комментарии / источник параметров
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
