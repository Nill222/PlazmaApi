package plasmapi.project.plasma.service;

/**
 * Физические константы в СИ.
 * Все значения соответствуют современным рекомендованным значениям CODATA.
 */
public final class PhysicalConstants {

    private PhysicalConstants() {} // предотвращение создания экземпляров

    // --- Фундаментальные константы ---
    public static final double E_CHARGE      = 1.602176634e-19;          // Кл, элементарный заряд
    public static final double E_CHARGE_SQ   = E_CHARGE * E_CHARGE;     // Кл²
    public static final double EPS0          = 8.8541878128e-12;         // Ф/м, электрическая постоянная
    public static final double KB            = 1.380649e-23;             // Дж/К, постоянная Больцмана
    public static final double NA            = 6.02214076e23;            // моль⁻¹, число Авогадро
    public static final double R             = KB * NA;                  // Дж/(моль·К), газовая постоянная
    public static final double H             = 6.62607015e-34;           // Дж·с, постоянная Планка
    public static final double HBAR          = H / (2 * Math.PI);        // Дж·с, редуцированная постоянная Планка
    public static final double C             = 299792458.0;              // м/с, скорость света
    public static final double U             = 1.66053906660e-27;        // кг, атомная единица массы

    // --- Атомные единицы ---
    public static final double A0            = 0.529177210903e-10;       // м, боровский радиус
    public static final double EV            = 1.602176634e-19;          // Дж, электронвольт
    public static final double RY            = 13.605693122994 * EV;     // Дж, ридберг

    // --- Константы для конкретных моделей (опционально) ---
    public static final double ZBL_A0        = 0.4685e-10;               // м, постоянная экранирования ZBL
    public static final double ZBL_A0_FACTOR = 0.8854;                   // множитель в радиусе экранирования Линдхарда
}
