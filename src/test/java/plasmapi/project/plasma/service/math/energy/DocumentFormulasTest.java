package plasmapi.project.plasma.service.math.energy;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.math.PhysicsMath;
import plasmapi.project.plasma.service.math.energy.impl.FluenceIntegrationServiceImpl;
import plasmapi.project.plasma.service.math.energy.impl.ModifiedLayerThicknessServiceImpl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DocumentFormulasTest {

    private final FluenceIntegrationServiceImpl fluenceService = new FluenceIntegrationServiceImpl();
    private final ModifiedLayerThicknessServiceImpl layerService = new ModifiedLayerThicknessServiceImpl();

    @Test
    void formula4_increasesWithExposureTime() {
        PlasmaConfiguration cfg = new PlasmaConfiguration();
        cfg.setChamberWidth(0.3);
        cfg.setChamberDepth(0.2);
        cfg.setPressure(10.0);

        FluenceFormulaInput shortRun = new FluenceFormulaInput(
                cfg, 400.0, 500.0, 1.0e18, 0.0, 0.0, 10.0, t -> 1.0, 0.35
        );
        FluenceFormulaInput longRun = new FluenceFormulaInput(
                cfg, 400.0, 500.0, 1.0e18, 0.0, 0.0, 100.0, t -> 1.0, 0.35
        );

        double phiShort = fluenceService.integrateDocumentFormula(shortRun);
        double phiLong = fluenceService.integrateDocumentFormula(longRun);

        assertTrue(phiLong > phiShort);
    }

    @Test
    void electronTemperatureKelvinConvertedToEv() {
        double teEv = ModifiedLayerThicknessServiceImpl.toElectronVolts(11600.0);
        assertTrue(teEv > 0.5 && teEv < 2.0);
    }

    @Test
    void formula5_usesSinSquaredAngularCorrection() {
        LayerThicknessInput normal = new LayerThicknessInput(
                1.0e18, 0.35, 0.0, 400.0, 10.0, 5.0, 1.5, 500.0
        );
        LayerThicknessInput oblique = new LayerThicknessInput(
                1.0e18, 0.35, Math.toRadians(60.0), 400.0, 10.0, 5.0, 1.5, 500.0
        );

        double hNormal = layerService.computeThickness(normal);
        double hOblique = layerService.computeThickness(oblique);

        assertTrue(hNormal > hOblique);
    }

    @Test
    void transportFluenceUsesBeamWhenDocumentFluenceIsTiny() {
        double ionFlux = 1.0e18;
        double exposureTime = 3600.0;
        double beam = ionFlux * exposureTime;
        double resolved = PhysicsMath.resolveIonFluenceForTransport(5000.0, ionFlux, exposureTime, 1.0);
        assertEquals(beam, resolved, beam * 1e-6);
    }
}
