package plasmapi.project.plasma.service.math.slr;


import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.slr.SLRResultDto;

import java.util.Arrays;

@Service
public class SLRServiceImpl implements SLRService {

    /**
     * Вычисление локального и глобального SLR поля с учетом:
     *  - θ (угол падения ионов)
     *  - Fluence (поток ионов)
     *  - многослойной структуры
     * @param field - поле энергии по слоям [layer][time]
     * @param slrParam - параметр SLR (степень нелинейности)
     * @param theta - угол падения в радианах
     * @param fluence - флюенс ионов, масштаб энергии
     * @return глобальный и локальный SLR
     */
    public SLRResultDto computeSLR(double[][] field, double slrParam, double theta, double fluence){
        if(field == null || field.length == 0) return new SLRResultDto(0.0, new double[0][0]);

        int n = field.length, m = field[0].length;
        double p = slrParam > 0 ? slrParam : 1.0;
        double[][] local = new double[n][m];
        double sum = 0.0;

        double angleFactor = Math.cos(theta);  // энергия снижается с увеличением угла
        double fluenceFactor = Math.max(fluence, 0); // масштабируем по потоку

        for(int i = 0; i < n; i++){
            for(int j = 0; j < m; j++){
                double[] neigh = neighbors(field,i,j);
                if(neigh.length == 0){ local[i][j] = 0; continue;}
                double acc = 0;
                for(double d : neigh) acc += Math.pow(Math.abs(d) * angleFactor * fluenceFactor, p);
                local[i][j] = Math.pow(acc / neigh.length, 1.0/p);
                sum += local[i][j];
            }
        }

        double global = sum / (n*m);
        return new SLRResultDto(global, local);
    }

    private double[] neighbors(double[][] f, int i, int j){
        int n = f.length, m = f[0].length;
        int[] di = {-1,0,1,0};
        int[] dj = {0,1,0,-1};
        double center = f[i][j];
        double[] temp = new double[4];
        int count = 0;
        for(int k = 0; k < 4; k++){
            int ni = i + di[k], nj = j + dj[k];
            if(ni >= 0 && ni < n && nj >= 0 && nj < m) temp[count++] = f[ni][nj] - center;
        }
        return Arrays.copyOf(temp, count);
    }
}
