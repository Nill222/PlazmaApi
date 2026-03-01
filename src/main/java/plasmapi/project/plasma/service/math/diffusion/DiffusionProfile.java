package plasmapi.project.plasma.service.math.diffusion;

import java.util.List;

/**
 * Результат расчёта диффузионного профиля под облучением.
 * Содержит коэффициенты диффузии, энергии активации и профиль концентрации.
 */
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

    public DiffusionProfile(double D1, double D2, double Q1_ev, double Q2_ev,
                            double D_thermal, double D_effective, double meanDepth,
                            List<Double> depths, List<Double> concentration) {
        this.D1 = D1;
        this.D2 = D2;
        this.Q1_ev = Q1_ev;
        this.Q2_ev = Q2_ev;
        this.D_thermal = D_thermal;
        this.D_effective = D_effective;
        this.meanDepth = meanDepth;
        this.depths = depths;
        this.concentration = concentration;
    }

    public double getD1() {
        return D1;
    }

    public double getD2() {
        return D2;
    }

    public double getQ1_ev() {
        return Q1_ev;
    }

    public double getQ2_ev() {
        return Q2_ev;
    }

    public double getD_thermal() {
        return D_thermal;
    }

    public double getD_effective() {
        return D_effective;
    }

    public double getMeanDepth() {
        return meanDepth;
    }

    public List<Double> getDepths() {
        return depths;
    }

    public List<Double> getConcentration() {
        return concentration;
    }
}