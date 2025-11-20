package plasmapi.project.plasma.service.math.thermal;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.dto.mathDto.thermal.LocalHeatingRequest;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalDto;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalProfileResult;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.atom.StructureType;
import plasmapi.project.plasma.service.math.lattice.LatticePhysics;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.DoubleUnaryOperator;

/**
 * ThermalServiceImpl — модель нагрева/остывания.
 *
 * Использует:
 *  - Debye model для молярной теплоёмкости: C_v,molar = 9 R (T/θ_D)^3 ∫_0^{θ_D/T} x^4 e^x/(e^x-1)^2 dx
 *  - λ(T) = λ0 * structFactor * (T_ref / T)  (простая аппроксимация; легко заменить)
 *  - lumped capacitance / Newton cooling с характерной толщиной L
 *
 * Требования к ThermalDto (желательно иметь в DTO):
 *  - T0(), tMax(), dt()
 *  - density() (kg/m3) -- если нет, используется 7874 (Fe)
 *  - thickness() (m) -- если нет, используется 1e-6 m
 *  - area() (m2) -- если нет, используется 1e-4 m2
 *  - ionEnergy() (J) — суммарная энергия ионов, поданная на участок (опционально)
 *  - exposureTime() (s) — время, за которое подана ionEnergy (опционально)
 *  - lambda0() (W/mK) — базовая теплопроводность материала при Tref (опционально, default 50 W/mK)
 *  - debyeTemperature() (K) — температура Дебая материала (если нет, берётся из atom.debyeTemperature через dto.potential/structure)
 *  - structure() — StructureType для поправки теплопроводности
 *  - potential() — PotentialParameters (можно учесть stiffness/energy)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ThermalServiceImpl implements ThermalService {

    private static final double R = 8.314462618; // J/(mol K)
    private static final double TREF = 300.0;

    @Override
    public List<Double> simulateCooling(ThermalDto dto) {
        double T0 = safe(dto.T0(), 300.0);
        double tMax = safe(dto.tMax(), 1.0);
        double dt = safe(dto.dt(), 0.01);
        if (dt <= 0) dt = 1e-3;

        // geometric / material
        double thickness = safe(dto.thickness(), 1e-6);
        double area = safe(dto.area(), 1e-4);
        double density = safe(dto.density(), 7874.0); // Fe default
        double lambda0 = safe(dto.lambda0(), 50.0);

        // choose structure factor
        AtomList atom = dto.atom();
        var structure = dto.structure() != null ? dto.structure() : (atom != null ? atom.getStructure() : null);
        double structFactor = structure != null ? LatticePhysics.thermalConductivityFactor(structure) : 1.0;

        // potential stiffness influence
        PotentialParameters pot = dto.potential();
        double potFactor;
        if (pot != null) {
            potFactor = 1.0 / (1.0 + 1e-20 * Math.max(0.0, pot.stiffness()));
        } else {
            potFactor = 1.0;
        }

        DoubleUnaryOperator lambdaOfT = (T) -> {
            double lam = lambda0 * structFactor * potFactor;
            double tf = T > 0 ? TREF / T : 1.0;
            double lamT = lam * Math.min(Math.max(tf, 0.2), 5.0);
            return lamT;
        };

        // mass & heat capacity
        double volume = area * thickness;
        double mass = Math.max(1e-12, density * volume);

        double molarMass = Double.NaN;
        if (dto.molarMass() != null) molarMass = dto.molarMass();
        if (Double.isNaN(molarMass) && atom != null && atom.getMass() != null) {
            // atom.getMass() expected kg per atom -> to kg/mol
            molarMass = atom.getMass() * 6.02214076e23;
        }
        if (Double.isNaN(molarMass)) molarMass = 55.845e-3; // Fe fallback kg/mol

        double thetaD = safe(dto.debyeTemperature(), (atom != null && atom.getDebyeTemperature() != null) ? atom.getDebyeTemperature() : 470.0);

        int steps = Math.max(1, (int) Math.ceil(tMax / dt));
        List<Double> temps = new ArrayList<>(steps + 1);
        double T = T0;
        temps.add(T);

        double molarToMass = 1.0 / molarMass;

        double powerInput = 0.0;
        if (dto.ionEnergy() != null && dto.exposureTime() != null && dto.exposureTime() > 0) {
            powerInput = dto.ionEnergy() / dto.exposureTime();
        } else if (dto.powerInput() != null) {
            powerInput = dto.powerInput();
        }

        for (int i = 1; i <= steps; i++) {
            // Debye molar heat capacity
            double Cvm = debyeMolarHeatCapacity(T, thetaD);
            double CvMass = Cvm * molarToMass; // J/(kg K)
            double heatCapacityTotal = CvMass * mass; // J/K

            double lambdaT = lambdaOfT.applyAsDouble(T);
            double h = lambdaT / Math.max(thickness, 1e-9);
            h = Math.min(Math.max(h, 0.1), 1e6);

            double Tenv = safe(dto.envTemp(), 300.0);
            double Pout = h * area * (T - Tenv);

            double Pin = powerInput;
            if (dto.energyDensityPerSec() != null) {
                Pin += dto.energyDensityPerSec() * volume;
            }

            double dTdt = (Pin - Pout) / Math.max(heatCapacityTotal, 1e-12);
            double Tnext = T + dTdt * dt;

            if (Double.isNaN(Tnext) || Double.isInfinite(Tnext)) Tnext = Tenv;
            if (Tnext < 0) Tnext = 0.0;

            temps.add(Tnext);
            T = Tnext;
        }

        return temps;
    }

    private double debyeMolarHeatCapacity(double T, double theta) {
        if (T <= 0) return 0.0;
        double xMax = theta / T;
        if (xMax < 1e-6) return 3.0 * R;
        if (xMax > 50.0) {
            double coeff = (12.0 / 5.0) * Math.pow(Math.PI, 4) * R;
            return coeff * Math.pow(T / theta, 3);
        }
        int n = 512;
        if (n % 2 == 1) n++;
        double h = xMax / n;
        double sum = 0.0;
        for (int i = 0; i <= n; i++) {
            double x = i * h;
            double fx = 0.0;
            if (x > 0) {
                double ex = Math.exp(x);
                double denom = (ex - 1.0);
                fx = Math.pow(x, 4) * ex / (denom * denom);
            }
            if (i == 0 || i == n) sum += fx;
            else if (i % 2 == 0) sum += 2.0 * fx;
            else sum += 4.0 * fx;
        }
        double integral = (h / 3.0) * sum;
        return 9.0 * R * Math.pow(T / theta, 3) * integral;
    }

    private double safe(Double v, double fallback) {
        return v != null ? v : fallback;
    }
}
