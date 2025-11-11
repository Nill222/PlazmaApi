package plasmapi.project.plasma.controller.logik;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmapi.project.plasma.controller.handler.exception.NotFoundException;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.dto.logikDTO.atom.AtomDTO;
import plasmapi.project.plasma.dto.logikDTO.atom.AtomListDTO;
import plasmapi.project.plasma.dto.logikDTO.atom.CreateAtomListDto;
import plasmapi.project.plasma.mapper.atom.AtomListReadMapper;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.service.logik.AtomService;

import java.util.List;

@RestController
@RequestMapping("/atoms")
@RequiredArgsConstructor
public class AtomController {

    private final AtomService atomService;
    private final AtomListReadMapper atomListReadMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AtomListDTO>>> getAllAtoms() {
        List<AtomListDTO> dtos = atomService.findAll().stream()
                .map(atomListReadMapper::map)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(dtos, "Все атомы получены", HttpStatus.OK.value()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AtomListDTO>> getAtomById(@PathVariable Integer id) {
        AtomList atom = atomService.findById(id)
                .orElseThrow(() -> new RuntimeException("Атом с id " + id + " не найден"));
        return ResponseEntity.ok(new ApiResponse<>(atomListReadMapper.map(atom), "Атом найден", HttpStatus.OK.value()));
    }

    @GetMapping("/config/{configId}")
    public ResponseEntity<ApiResponse<List<AtomDTO>>> getAtomsByConfig(@PathVariable Integer configId) {
        List<AtomDTO> dtos = atomService.getAtomsByConfig(configId); // сервис возвращает DTO
        return ResponseEntity.ok(
                new ApiResponse<>(dtos, "Атомы для конфига получены", HttpStatus.OK.value())
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AtomListDTO>> createAtom(@Valid @RequestBody CreateAtomListDto atom) {

        AtomList created = atomService.create(atom)
                .orElseThrow(() -> new RuntimeException("Не удалось создать атом"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(atomListReadMapper.map(created), "Атом создан", HttpStatus.CREATED.value()));
    }

    @GetMapping("/symbol/{symbol}")
    public ResponseEntity<ApiResponse<List<AtomListDTO>>> getAtom(@PathVariable String symbol) {
        try {
            List<AtomListDTO> atoms = atomService.getAtomProperties(symbol);
            return ResponseEntity.ok(
                    new ApiResponse<>(atoms,
                            "Найдено " + atoms.size() + " атом(ов), содержащих символ '" + symbol + "'",
                            HttpStatus.OK.value())
            );
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(null, e.getMessage(), HttpStatus.NOT_FOUND.value()));
        }
    }
}
