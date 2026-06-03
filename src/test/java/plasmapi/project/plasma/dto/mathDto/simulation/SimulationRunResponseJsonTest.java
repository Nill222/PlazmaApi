package plasmapi.project.plasma.dto.mathDto.simulation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import plasmapi.project.plasma.service.math.PhysicsStats;
import plasmapi.project.plasma.service.math.diffusion.DiffusionIntermediate;
import plasmapi.project.plasma.service.math.diffusion.DiffusionProfile;
import plasmapi.project.plasma.service.math.energy.EnergyDepositionResult;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SimulationRunResponseJsonTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void diffusionProfileJsonUsesFrontendFieldNames() throws Exception {
        DiffusionProfile profile = new DiffusionProfile(
                1e-18, 1e-19, 1.0, 2.0,
                3e-15, 4e-15, 1e-8,
                List.of(0.0, 1e-9),
                List.of(1.0, 0.5),
                null,
                new EnergyDepositionResult(100, 1e5, 1.2, 1.1, 1e18, 1e20, 1e-9,
                        1e-6, 1.0, 1.0, 350, 400),
                new DiffusionIntermediate(1e-16, 3e-15, 1.5, 1e15, 1e-8, 3e-9, 1e9, 2e-10)
        );

        JsonNode root = mapper.readTree(mapper.writeValueAsString(profile));

        assertTrue(root.has("d1") || root.has("D1"), "expected d1: " + root.fieldNames());
        assertTrue(root.has("d_effective") || root.has("dEffective") || root.has("D_effective"),
                "expected d_effective: " + root.fieldNames());
        assertFalse(root.has("stats"), "nested stats must not be serialized");
    }
}
