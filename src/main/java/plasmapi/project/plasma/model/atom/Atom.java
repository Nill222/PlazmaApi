package plasmapi.project.plasma.model.atom;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import plasmapi.project.plasma.model.res.Config;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "atoms")
public class Atom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id")
    private Config config;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atom_list_id")
    private AtomList atomList;

    private Double x;
    private Double y;
    private Double vx;
    private Double vy;
}

