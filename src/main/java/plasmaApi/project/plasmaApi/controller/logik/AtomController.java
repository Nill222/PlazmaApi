package plasmaApi.project.plasmaApi.controller.logik;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmaApi.project.plasmaApi.dto.ApiResponse;
import plasmaApi.project.plasmaApi.dto.logikDTO.AtomDTO;
import plasmaApi.project.plasmaApi.mapper.Mapper;
import plasmaApi.project.plasmaApi.model.atom.Atom;
import plasmaApi.project.plasmaApi.model.atom.AtomList;
import plasmaApi.project.plasmaApi.service.logik.AtomService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/atoms")
@RequiredArgsConstructor
public class AtomController {

    private final AtomService atomService;
    private final Mapper atomMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AtomDTO>>> getAllAtoms() {
        List<AtomDTO> dtos = atomService.findAll().stream()
                .map(atomMapper::toDTO)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(dtos, "Все атомы получены", HttpStatus.OK.value()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AtomDTO>> getAtomById(@PathVariable Integer id) {
        Atom atom = atomService.findById(id)
                .orElseThrow(() -> new RuntimeException("Атом с id " + id + " не найден"));
        return ResponseEntity.ok(new ApiResponse<>(atomMapper.toDTO(atom), "Атом найден", HttpStatus.OK.value()));
    }

    @GetMapping("/config/{configId}")
    public ResponseEntity<ApiResponse<List<AtomDTO>>> getAtomsByConfig(@PathVariable Integer configId) {
        List<AtomDTO> dtos = atomService.getAtomsByConfig(configId).stream()
                .map(atomMapper::toDTO)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(dtos, "Атомы для конфига получены", HttpStatus.OK.value()));
    }

    @GetMapping("/{symbol}")
    public ResponseEntity<ApiResponse<AtomList>> getAtom(@PathVariable String symbol) {
        Optional<AtomList> atomOpt = atomService.getAtomProperties(symbol);

        if (atomOpt.isPresent()) {
            ApiResponse<AtomList> response = new ApiResponse<>(
                    atomOpt.get(),
                    "Атом найден",
                    HttpStatus.OK.value()
            );
            return ResponseEntity.ok(response);
        } else {
            ApiResponse<AtomList> response = new ApiResponse<>(
                    null,
                    "Атом с именем " + symbol + " не найден",
                    HttpStatus.NOT_FOUND.value()
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
}
