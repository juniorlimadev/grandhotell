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

    /**
     * Lista todos os quartos cadastrados com paginação.
     */
    @GetMapping()
    public ResponseEntity<CustomPageDTO<QuartoDTO>> listarTodos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nome") String sort,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        log.info("Iniciando listagem de todos os quartos");
        CustomPageDTO<QuartoDTO> quartoDto = quartoService.findAll(page, size, sort, sortDirection);
        log.info("Quartos listados com sucesso");
        return ResponseEntity.ok(quartoDto);
    }

    /**
     * Busca um quarto específico pelo ID.
     */
    @GetMapping("/{idQuarto}")
    public ResponseEntity<Map<String, Object>> buscarPorId(@PathVariable Integer idQuarto) throws NotFoundException {
        log.info("Buscando quarto com ID: {}", idQuarto);
        Quarto quarto = quartoService.findById(idQuarto);
        return ResponseEntity.ok(createResponseMessage("Quarto encontrado com sucesso", quarto, "Quarto"));
    }

    /**
     * Cadastra um novo quarto no sistema.
     */
    @PostMapping()
    public ResponseEntity<Map<String, Object>> salvar(@RequestBody @Valid QuartoCreateDTO quartoCreateDTO) throws RegraDeNegocioException {
        log.info("Criando novo Quarto: {}", quartoCreateDTO.getNome());
        QuartoDTO entity = quartoService.save(quartoCreateDTO);
        log.info("Quarto criado com sucesso");
        return ResponseEntity.status(HttpStatus.CREATED).body(createResponseMessage("Quarto criado com sucesso.", entity, "Quarto"));
    }

    /**
     * Atualiza os dados de um quarto existente.
     */
    @PutMapping("/{idQuarto}")
    public ResponseEntity<Map<String, Object>> atualizar(@PathVariable Integer idQuarto, @RequestBody @Valid QuartoCreateDTO quartoUpdateDTO) throws RegraDeNegocioException {
        log.info("Atualizando Quarto com ID: {}", idQuarto);
        QuartoDTO entity = quartoService.update(idQuarto, quartoUpdateDTO);
        log.info("Quarto atualizado com sucesso");
        return ResponseEntity.status(HttpStatus.OK).body(createResponseMessage("Quarto atualizado com sucesso.", entity, "Quarto"));
    }

    /**
     * Remove um quarto do sistema.
     */
    @DeleteMapping("/{idQuarto}")
    public ResponseEntity<Map<String, Object>> deletar(@PathVariable Integer idQuarto) throws RegraDeNegocioException {
        log.info("Deletando Quarto com ID {}", idQuarto);
        quartoService.delete(idQuarto);
        log.info("Quarto deletado com sucesso");
        return ResponseEntity.ok(messageResponse("Quarto deletado com sucesso."));
    }
}

