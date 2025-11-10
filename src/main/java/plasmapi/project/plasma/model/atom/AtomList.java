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

}
