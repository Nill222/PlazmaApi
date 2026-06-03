package plasmapi.project.plasma.service.math.diffusion;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import plasmapi.project.plasma.service.math.PhysicsStats;
import plasmapi.project.plasma.service.math.energy.EnergyDepositionResult;

import java.util.List;

/**
 * Результат расчёта диффузионного профиля под облучением.
 * Содержит коэффициенты диффузии, энергии активации и профиль концентрации.
 */
@Getter
@AllArgsConstructor
public class DiffusionProfile {
    private final double D1;               // предэкспонента первого канала, м²/с
    private final double D2;               // предэкспонента второго канала, м²/с
    @JsonProperty("q1_ev")
    private final double Q1_ev;            // энергия активации первого канала, эВ
    @JsonProperty("q2_ev")
    private final double Q2_ev;            // энергия активации второго канала, эВ
    @JsonProperty("d_thermal")
    private final double D_thermal;        // термический коэффициент диффузии, м²/с
    @JsonProperty("d_effective")
    private final double D_effective;      // эффективный коэффициент диффузии (с учётом облучения), м²/с
    private final double meanDepth;         // средняя глубина проникновения, м
    private final List<Double> depths;      // массив глубин для построения профиля, м
    private final List<Double> concentration; // относительная концентрация (нормированная) на соответствующих глубинах
    @JsonIgnore
    private final PhysicsStats stats;
    private final EnergyDepositionResult energyDeposition;
    private final DiffusionIntermediate diffusionIntermediate;
}