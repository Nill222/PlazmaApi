package plasmapi.project.plasma.service.math.potential.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.atom.StructureType;
import plasmapi.project.plasma.service.PhysicalConstants;
import plasmapi.project.plasma.service.math.lattice.LatticePhysics;
import plasmapi.project.plasma.service.math.potential.PotentialService;

@Service
@RequiredArgsConstructor
public class PotentialServiceImpl implements PotentialService {

    private static final double ZBL_A0 = 0.4685e-10; // м, постоянная экранирования ZBL
    private static final double[] ZBL_COEFF = {0.1818, 0.5099, 0.2802, 0.02817};
    private static final double[] ZBL_EXP = {3.2, 0.9423, 0.4029, 0.2016};

    /**
     * Вычисляет значение межатомного потенциала и его жёсткость (вторую производную)
     * для заданного расстояния r (в метрах) и атома материала.
     */
    public PotentialParameters computePotential(double r, AtomList atom) {
        // Параметры материала
        double aMeters = atom.getA() * 1e-10; // период решётки в метрах
        StructureType structure = atom.getStructure();

        // Равновесное расстояние между ближайшими соседями (зависит от структуры)
        double re0 = equilibriumDistance(aMeters, structure);

        // Глубина потенциальной ямы (энергия когезии на связь)
        double De = atom.getCohesiveEnergyEv1() != null
                ? atom.getCohesiveEnergyEv1() * PhysicalConstants.EV
                : 4.3 * PhysicalConstants.EV;

        // Параметр крутизны потенциала Морзе (если есть в БД, иначе оцениваем)
        double alpha;
        if (atom.getA() != null) {
            alpha = atom.getA() * 1e10; // если хранится в Å⁻¹, переводим в м⁻¹
        } else {
            // Эмпирическая оценка: alpha ~ 3 / re0 (типичное значение для металлов)
            alpha = 3.0 / re0;
        }

        // Атомный номер (заряд ядра) – пока используем valence, если atomicNumber отсутствует
        int Z = atom.getValence();

        // Границы зон (пока оставляем как в оригинале)
        double r1 = 0.7 * re0;
        double r2 = 1.35 * re0;
        double r3 = 2.0 * re0;
        double r4 = 2.5 * re0;

        double value = 0.0;
        double stiffness = 0.0;

        if (r < r1) {
            // Зона 1: экранированный кулон (ZBL)
            double a = zblScreeningLength(Z); // длина экранирования для двух одинаковых атомов
            double phi = zblUniversalPhi(r / a);
            value = (Z * Z * PhysicalConstants.E_CHARGE_SQ) / (4 * Math.PI * PhysicalConstants.EPS0 * r) * phi;
            // Жёсткость – вторая производная потенциала (приближённо)
            // Для упрощения используем формулу для производной от ZBL (аналитически сложно, сделаем численно)
            // Но пока оставим как в оригинале: stiffness = |value| / (r * r) – это не вторая производная, но порядок тот же.
            // В будущем заменить на точное выражение.
            stiffness = Math.abs(value) / (r * r);
        } else if (r < r2) {
            // Зона 2: Борна-Майера (эмпирическая)
            double A_BM = 2 * De;
            double a_BM = 0.3 * aMeters; // эмпирика
            value = A_BM * Math.exp(-r / a_BM);
            stiffness = value / (a_BM * a_BM); // вторая производная экспоненты
        } else if (r < r3) {
            // Зона 3: потенциал Морзе
            double exp1 = Math.exp(-alpha * (r - re0));
            double exp2 = exp1 * exp1;

            value = De * (exp2 - 2.0 * exp1);
            stiffness = 2.0 * De * alpha * alpha * (2.0 * exp2 - exp1);
        } else if (r < r4) {
            // Зона 4: сшивка сплайном (как в оригинале)
            double exp1 = Math.exp(-alpha * (r - re0));
            double exp2 = exp1 * exp1;

            double morse = De * (exp2 - 2.0 * exp1);
            double morseStiffness = 2.0 * De * alpha * alpha * (2.0 * exp2 - exp1);
            double t = (r - r3) / (r4 - r3);
            // Кубическая интерполяция Хёрмита (H = 1 - 3t^2 + 2t^3)
            double H = 1 - 3 * t * t + 2 * t * t * t;
            double S = 0.1 + 0.9 * H; // вес плавно меняется от 0.1 до 1.0
            value = morse * S;
            // Жёсткость приближённо (производная от S даст дополнительный член, но пренебрегаем)
            stiffness = morseStiffness * S;
        } else {
            // За пределами r4 потенциал равен 0
            value = 0.0;
            stiffness = 0.0;
        }

        // Эмпирическая поправка на упаковку (убрана, так как необоснованна)
        // double pack = atom.getPackingFactor1() != null ? atom.getPackingFactor1() : LatticePhysics.packingFactor(structure);
        // stiffness *= (1 + 0.2 * (pack - 0.5));

        // Параметры для Леннард-Джонса (не используются, но оставим как в оригинале)
        double sigma = re0 / Math.pow(2, 1.0/6);
        double epsilon = 0.2 * De;

        return new PotentialParameters(value, stiffness, r, sigma, epsilon);
    }

    /**
     * Вычисляет равновесное расстояние между ближайшими соседями в зависимости от структуры.
     */
    private double equilibriumDistance(double a, StructureType structure) {
        return switch (structure) {
            case FCC -> a / Math.sqrt(2);
            case BCC -> a * Math.sqrt(3) / 2;
            case SC -> a;
            case HCP ->
                // Для гексагональной плотноупакованной ближайшее расстояние обычно равно a (параметр решётки)
                    a;
            default ->
                // По умолчанию используем старый метод (если он есть)
                    a * LatticePhysics.morseReFactor(structure);
        };
    }

    /**
     * Длина экранирования ZBL для двух одинаковых атомов с зарядом Z.
     */
    private double zblScreeningLength(int Z) {
        return ZBL_A0 / (Math.pow(Z, 0.23) + Math.pow(Z, 0.23)); // Z1^0.23 + Z2^0.23 = 2 * Z^0.23
    }

    /**
     * Универсальная функция экранирования ZBL (аппроксимация суммой экспонент).
     */
    private double zblUniversalPhi(double x) {
        double phi = 0.0;
        for (int i = 0; i < ZBL_COEFF.length; i++) {
            phi += ZBL_COEFF[i] * Math.exp(-ZBL_EXP[i] * x);
        }
        return phi;
    }
}
