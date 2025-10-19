package plasmaApi.project.plasmaApi.model.res;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    @JoinColumn(name = "ion_id")
    private Ion ion;

    private Double energy;
    private Double potential;
    private Double temperature;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

}
