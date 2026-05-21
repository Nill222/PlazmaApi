package plasmapi.project.plasma.model.res;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.BatchSize;
import lombok.Data;
import lombok.NoArgsConstructor;
import plasmapi.project.plasma.model.atom.AtomList;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "result_atom_components")
public class ResultAtomComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "result_id", nullable = false)
    private Result result;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atom_list_id", nullable = false)
    @BatchSize(size = 50)
    private AtomList atom;

    @Column(nullable = false)
    private Double fraction;
}
