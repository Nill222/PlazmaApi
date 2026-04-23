package plasmapi.project.plasma.service.math.diffusion;

import lombok.AllArgsConstructor;
import lombok.Getter;
import plasmapi.project.plasma.service.math.PhysicsStats;

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
    private final double Q1_ev;            // энергия активации первого канала, эВ
    private final double Q2_ev;            // энергия активации второго канала, эВ
    private final double D_thermal;        // термический коэффициент диффузии, м²/с
    private final double D_effective;      // эффективный коэффициент диффузии (с учётом облучения), м²/с
    private final double meanDepth;         // средняя глубина проникновения, м
    private final List<Double> depths;      // массив глубин для построения профиля, м
    private final List<Double> concentration; // относительная концентрация (нормированная) на соответствующих глубинах
    private final PhysicsStats stats;
}