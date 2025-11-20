package plasmapi.project.plasma.service.math.slr;


import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.slr.SLRResult;

@Service
public class SLRServiceImpl implements SLRService {

    @Override
    public SLRResult computeSLR(double[][] field, double slrParam) {
        int n = field.length;
        if (n==0) return new SLRResult(0.0, new double[0][0]);
        int m = field[0].length;
        double[][] local = new double[n][m];
        double sum = 0.0;
        for (int i=0;i<n;i++) {
            for (int j=0;j<m;j++) {
                double[] neigh = neighbors(field, i, j);
                double p = slrParam <= 0 ? 1.0 : slrParam;
                double acc = 0.0;
                for (double d : neigh) acc += Math.pow(Math.abs(d), p);
                double val = Math.pow(acc / Math.max(1, neigh.length), 1.0/p);
                local[i][j] = val;
                sum += val;
            }
        }
        double global = sum / (n*m);
        return new SLRResult(global, local);
    }

    private double[] neighbors(double[][] f, int i, int j) {
        int n=f.length, m=f[0].length;
        java.util.List<Double> list = new java.util.ArrayList<>();
        int[] di = {-1,0,1,0};
        int[] dj = {0,1,0,-1};
        for (int k=0;k<4;k++) {
            int ni=i+di[k], nj=j+dj[k];
            if (ni>=0 && ni<n && nj>=0 && nj<m) {
                list.add(f[ni][nj] - f[i][j]);
            }
        }
        return list.stream().mapToDouble(Double::doubleValue).toArray();
    }
}
