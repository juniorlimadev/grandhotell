package br.com.dbc.hotel.controller;

import br.com.dbc.hotel.dto.custompage.CustomPageDTO;
import br.com.dbc.hotel.dto.quarto.QuartoCreateDTO;
import br.com.dbc.hotel.dto.quarto.QuartoDTO;
import br.com.dbc.hotel.entity.Quarto;
import br.com.dbc.hotel.exceptions.NotFoundException;
import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import br.com.dbc.hotel.service.QuartoService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.Map;

import static br.com.dbc.hotel.utils.CreateResponse.createResponseMessage;
import static br.com.dbc.hotel.utils.CreateResponse.messageResponse;


@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/quarto")
@Tag(name = "Quarto", description = "Endpoints para gerenciamento de quartos")
public class QuartoController {

    private final QuartoService quartoService;

    @GetMapping()
    public ResponseEntity<CustomPageDTO<QuartoDTO>> encontrarTodosQuartos(@RequestParam(defaultValue = "0") int page,
                                                                           @RequestParam(defaultValue = "10") int size,
                                                                           @RequestParam(defaultValue = "nome") String sort,
                                                                          @RequestParam(defaultValue = "ASC") String sortDirection){
        log.info("Listando todos quartos");
        CustomPageDTO<QuartoDTO> quartoDto = quartoService.findAll(page, size, sort, sortDirection);
        log.info("Quartos listados com sucesso");
        return ResponseEntity.ok(quartoDto);
    }

    @GetMapping("/{idQuarto}")
    public ResponseEntity<Map<String, Object>> retornarUsuarioPorId(@PathVariable Integer idQuarto) throws NotFoundException {
        Quarto quarto = quartoService.findById(idQuarto);
        return ResponseEntity.ok(createResponseMessage("Quarto encontrado com sucesso", quarto, "Quarto"));
    }

    @PostMapping()
    public ResponseEntity<Map<String, Object>> adicionarUsuario(@RequestBody @Valid QuartoCreateDTO quartoCreateDTO) throws RegraDeNegocioException {
        log.info("Criando novo Quarto");
        QuartoDTO entity = quartoService.save(quartoCreateDTO);
        log.info("Quarto criado com sucesso");
        return ResponseEntity.status(HttpStatus.CREATED).body(createResponseMessage("Quarto criado com sucesso.", entity, "Quarto"));
    }

    @PutMapping("/{idQuarto}")
    public ResponseEntity<Map<String, Object>> atualizarUsuario(@PathVariable Integer idQuarto, @RequestBody @Valid QuartoCreateDTO usuarioCreateDTO) throws RegraDeNegocioException {
        log.info("Criando novo Quarto");
        QuartoDTO entity = quartoService.update(idQuarto, usuarioCreateDTO);
        log.info("Quarto criado com sucesso");
        return ResponseEntity.status(HttpStatus.CREATED).body(createResponseMessage("Quarto atualizado com sucesso.", entity, "Quarto"));
    }

    @DeleteMapping("/{idUsuario}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer idUsuario) throws RegraDeNegocioException {
        log.info("Deletando Quarto com ID {}", idUsuario);
        quartoService.delete(idUsuario);
        log.info("Quarto deletado com sucesso");
        return ResponseEntity.ok(messageResponse("Quarto deletado com sucesso."));
    }


}
