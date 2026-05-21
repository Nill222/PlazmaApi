package plasmapi.project.plasma.model.res;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;

@Entity
@BatchSize(size = 50)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "ions")
public class Ion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 20)
    private String name;

    private Double mass;

    private Integer charge;

}
