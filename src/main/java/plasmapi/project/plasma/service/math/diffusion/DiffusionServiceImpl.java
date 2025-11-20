package plasmapi.project.plasma.service.math.diffusion;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionRequest;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.StructureType;
import plasmapi.project.plasma.service.math.lattice.LatticePhysics;

import java.util.ArrayList;
import java.util.List;


/**
 * DiffusionServiceImpl
 *
 * Реализует Crank–Nicolson решение одномерной уравнения диффузии по глубине с:
 * - учётом структуры решётки (фактор LatticePhysics.diffusionStructureFactor)
 * - влиянием потенциала (степень жёсткости stiffness -> снижение подвижности)
 * - температурной подстройкой D(T) через активационную энергию (если задана)
 * - radiation-enhanced diffusion: добавочный член пропорционален damageEnergy или damageRate
 *
 * Возвращает профиль концентрации C(x) по глубине после времени tMax (DiffusionProfileDto).
 */
@Slf4j
@Service
public class DiffusionServiceImpl implements DiffusionService {

    private static final double R = 8.314462618;
    private static final double DEFAULT_DX = 1e-9;
    private static final double DEFAULT_DT = 0.1;
    private static final double MIN_DT = 1e-12;
    private static final double MIN_DX = 1e-12;

    @Override
    public DiffusionProfileDto calculateDiffusionProfile(DiffusionRequest dto) {
        // grid and steps
        double depth = dto.depth() > 0 ? dto.depth() : 1e-6;
        double DX = dto.dx() > 0 ? dto.dx() : DEFAULT_DX;
        DX = Math.max(DX, MIN_DX);
        double dt = dto.dt() > 0 ? dto.dt() : DEFAULT_DT;
        dt = Math.max(dt, MIN_DT);
        double tMax = dto.tMax() > 0 ? dto.tMax() : 1.0;

        int n = Math.max(2, (int) Math.ceil(depth / DX));
        int tSteps = Math.max(1, (int) Math.ceil(tMax / dt));

        double D0 = dto.D() > 0 ? dto.D() : 1e-18;
        StructureType structure = dto.structure() != null ? dto.structure() : StructureType.BCC;
        PotentialParameters pot = dto.potential();

        double structFactor = LatticePhysics.diffusionStructureFactor(structure);
        double potentialFactor = 1.0;
        if (pot != null) {
            potentialFactor = 1.0 / (1.0 + 1e-20 * Math.max(0.0, pot.stiffness()));
        }

        // damage-related enhancement
        double damageEnergy = dto.damageEnergy() != null ? dto.damageEnergy() : 0.0;
        double damageRate = dto.damageRate() != null ? dto.damageRate() : 0.0;
        double betaDamage = 1e18;
        double gammaRate = 1e12;

        double[] C = new double[n];
        double c0 = dto.c0();
        for (int i = 0; i < n; i++) C[i] = 0.0;
        C[0] = c0;

        double[] a = new double[n - 1];
        double[] b = new double[n];
        double[] c = new double[n - 1];
        double[] Cnew = new double[n];

        List<Double> depths = new ArrayList<>(n);
        for (int i = 0; i < n; i++) depths.add(i * DX);

        for (int t = 0; t < tSteps; t++) {
            double Tcur = dto.temperature() != null ? dto.temperature() : safeEstimateTemperature(dto);
            Double Q = dto.activationEnergy(); // J/mol

            double D_T = D0;
            if (Q != null && Q > 0 && Tcur > 1.0) {
                D_T = D0 * Math.exp(-Q / (R * Tcur));
            }

            double D_struct = D_T * structFactor * potentialFactor;

            double D_from_damage = 0.0;
            if (damageEnergy > 0.0) {
                D_from_damage += betaDamage * damageEnergy * D0;
            }
            if (damageRate > 0.0) {
                D_from_damage += gammaRate * damageRate;
            }

            double D_eff = Math.max(0.0, D_struct + D_from_damage);

            double r = D_eff * dt / (2.0 * DX * DX);
            if (r > 0.45) {
                // stability guard: reduce dt if too large
                double scale = 0.45 / Math.max(1e-12, r);
                dt *= scale;
                r = D_eff * dt / (2.0 * DX * DX);
                log.warn("Diffusion: adjusted dt for stability, new dt={}, r={}", dt, r);
            }

            for (int i = 0; i < n - 1; i++) {
                a[i] = -r;
                c[i] = -r;
            }
            for (int i = 0; i < n; i++) b[i] = 1.0 + 2.0 * r;

            // Dirichlet at 0, Neumann at end
            b[0] = 1.0; a[0] = 0.0; c[0] = 0.0;
            double[] d = new double[n];
            d[0] = c0;
            for (int i = 1; i < n - 1; i++) {
                d[i] = r * C[i - 1] + (1.0 - 2.0 * r) * C[i] + r * C[i + 1];
            }
            // Neumann last: mirror
            d[n - 1] = 2.0 * r * C[n - 2] + (1.0 - 2.0 * r) * C[n - 1];
            if (n - 2 >= 0) a[n - 2] = -2.0 * r;
            Cnew = thomasAlgorithm(a, b, c, d);

            Cnew[0] = c0;
            System.arraycopy(Cnew, 0, C, 0, n);
        }

        List<Double> conc = new ArrayList<>(n);
        for (int i = 0; i < n; i++) conc.add(C[i]);
        return new DiffusionProfileDto(depths, conc);
    }

    private double safeEstimateTemperature(DiffusionRequest dto) {
        if (dto.temperature() != null) return dto.temperature();
        return 300.0;
    }

    private double[] thomasAlgorithm(double[] a, double[] b, double[] c, double[] d) {
        int n = b.length;
        double[] cp = new double[n - 1];
        double[] dp = new double[n];
        double[] x = new double[n];

        cp[0] = c[0] / b[0];
        dp[0] = d[0] / b[0];
        for (int i = 1; i < n - 1; i++) {
            double m = b[i] - a[i - 1] * cp[i - 1];
            if (Math.abs(m) < 1e-18) m = 1e-18;
            cp[i] = c[i] / m;
            dp[i] = (d[i] - a[i - 1] * dp[i - 1]) / m;
        }
        double m = b[n - 1] - a[n - 2] * cp[n - 2];
        if (Math.abs(m) < 1e-18) m = 1e-18;
        dp[n - 1] = (d[n - 1] - a[n - 2] * dp[n - 2]) / m;

        x[n - 1] = dp[n - 1];
        for (int i = n - 2; i >= 0; i--) {
            x[i] = dp[i] - cp[i] * x[i + 1];
        }
        return x;
    }
}
