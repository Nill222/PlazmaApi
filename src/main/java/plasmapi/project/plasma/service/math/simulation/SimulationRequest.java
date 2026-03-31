package plasmapi.project.plasma.service.math.simulation;

import lombok.Getter;
import lombok.Setter;
import plasmapi.project.plasma.service.math.diffusion.AlloyComponentDto;

import java.util.List;

/**
 * Запрос на симуляцию от клиента.
 * Содержит все параметры, введённые пользователем в интерфейсе.
 */
@Getter
@Setter
public class SimulationRequest {
    private Integer atomId;           // например, "Cr(II) - Chromium"
    private Integer ionId;            // например, "O2 (+2)"
    private double voltage;            // В
    private double pressure;           // Па
    private double current;            // А
    private double electronTemp;       // К, температура электронов
    private double chamberWidth;       // м
    private double chamberDepth;       // м
    private double exposureTime;       // с
    private double angle;              // градусы
    private Double ambientTemp;         // К, температура окружающей среды (опционально, по умолчанию 300)
    private List<AlloyComponentDto> composition;
}
