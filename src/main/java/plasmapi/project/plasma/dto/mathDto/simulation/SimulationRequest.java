package plasmapi.project.plasma.dto.mathDto.simulation;

import lombok.Getter;
import lombok.Setter;
import plasmapi.project.plasma.dto.mathDto.diffusion.AlloyComponentDto;
import plasmapi.project.plasma.dto.mathDto.ion.IonComponentDto;

import java.util.List;

/**
 * Запрос на симуляцию от клиента.
 * Содержит все параметры, введённые пользователем в интерфейсе.
 */
@Getter
@Setter
public class SimulationRequest {
    /** ID конфигурации (configs.id) для сохранения результата в БД; по умолчанию 1 */
    private Integer configId;
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
    /** Расстояние между анодом и катодом (м); если не задано — из конфига энерговклада */
    private Double electrodeDistance;
    private Double ambientTemp;         // К, температура окружающей среды (опционально, по умолчанию 300)
    private List<AlloyComponentDto> composition;
    private List<IonComponentDto> ionComposition;
}
