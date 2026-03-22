package br.com.dbc.hotel.controller;

import br.com.dbc.hotel.dto.custompage.CustomPageDateDTO;
import br.com.dbc.hotel.dto.quarto.QuartoDTO;
import br.com.dbc.hotel.dto.reserva.ReservaCreateDTO;
import br.com.dbc.hotel.dto.reserva.ReservaDTO;
import br.com.dbc.hotel.entity.Reserva;
import br.com.dbc.hotel.exceptions.NotFoundException;
import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import br.com.dbc.hotel.service.ReservaService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static br.com.dbc.hotel.utils.CreateResponse.createResponseMessage;
import static br.com.dbc.hotel.utils.CreateResponse.messageResponse;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/reserva")
@Tag(name = "Reserva", description = "Endpoints para gerenciamento de reservas")
public class ReservaController {

    private final ReservaService reservaService;

    /**
     * Retorna todas as reservas vinculadas a um quarto específico.
     */
    @GetMapping("/quarto/{idQuarto}")
    public ResponseEntity<Map<String, Object>> listarPorQuarto(@PathVariable Integer idQuarto) {
        log.info("Buscando reservas para o quarto ID: {}", idQuarto);
        List<Reserva> reservas = reservaService.buscarReservasPorQuarto(idQuarto);
        return ResponseEntity.ok(createResponseMessage("Reservas por quarto encontradas com sucesso", reservas, "Reservas"));
    }

    /**
     * Cria uma nova reserva.
     */
    @PostMapping()
    public ResponseEntity<Map<String, Object>> criar(@RequestBody @Valid ReservaCreateDTO reservaCreateDTO) throws RegraDeNegocioException {
        log.info("Iniciando criação de nova Reserva");
        ReservaDTO entity = reservaService.save(reservaCreateDTO);
        log.info("Reserva criada com sucesso");
        return ResponseEntity.status(HttpStatus.CREATED).body(createResponseMessage("Reserva criada com sucesso.", entity, "Reserva"));
    }

    /**
     * Busca reservas que estejam ocupadas dentro de um intervalo de datas.
     */
    @GetMapping("/quartos-ocupados")
    public ResponseEntity<List<ReservaDTO>> buscarReservasPorIntervalo(
            @RequestParam("dtInicio") @DateTimeFormat(pattern = "dd-MM-yyyy") LocalDate dtInicio,
            @RequestParam("dtFim") @DateTimeFormat(pattern = "dd-MM-yyyy") LocalDate dtFim) throws RegraDeNegocioException {
        log.info("Recebendo requisição de ocupação: {} ate {}", dtInicio, dtFim);
        List<ReservaDTO> reservas = reservaService.buscarReservasPorIntervalo(dtInicio, dtFim);
        return ResponseEntity.ok(reservas);
    }

    /**
     * Busca quartos disponíveis (livres) para reserva em um intervalo de datas e ala.
     */
    @GetMapping("/quartos-livres")
    public CustomPageDateDTO<QuartoDTO> buscarQuartosLivresPorAlaEData(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "nome") String sortField,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String ala,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now()}")
            @DateTimeFormat(pattern = "dd-MM-yyyy") LocalDate dtInicio,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().plusDays(1)}")
            @DateTimeFormat(pattern = "dd-MM-yyyy") LocalDate dtFim) throws RegraDeNegocioException{
        log.info("Buscando quartos livres na ala {} de {} até {}", ala, dtInicio, dtFim);
        return reservaService.buscarQuartosLivresPorAlaEData(page, size, sortField, sortDirection, ala, dtInicio, dtFim);
    }

    /**
     * Busca os detalhes de uma reserva específica pelo ID.
     */
    @GetMapping("/{idReserva}")
    public ResponseEntity<Map<String,Object>> buscarPorId(@PathVariable Integer idReserva) throws NotFoundException {
        log.info("Buscando reserva com ID: {}", idReserva);
        Reserva byId = reservaService.findById(idReserva);
        return ResponseEntity.ok(createResponseMessage("Reserva encontrada", byId, "Reserva"));
    }

    /**
     * Lista todas as reservas associadas a um nome de usuário.
     */
    @GetMapping("/usuario/{nomeUsuario}")
    public ResponseEntity<Map<String,Object>> listarPorNomeUsuario(@PathVariable String nomeUsuario){
        log.info("Buscando reservas para o usuário: {}", nomeUsuario);
        List<ReservaDTO> reservaDTOS = reservaService.buscarReservasPorNomeUsuario(nomeUsuario);
        return ResponseEntity.ok(createResponseMessage("Reservas encontradas", reservaDTOS, "Reservas"));
    }

    /**
     * Atualiza os dados de uma reserva existente.
     */
    @PutMapping("/{idReserva}")
    public ResponseEntity<Map<String, Object>> atualizar(@PathVariable Integer idReserva, @RequestBody @Valid ReservaCreateDTO reservaCreateDTO) throws RegraDeNegocioException {
        log.info("Atualizando Reserva ID: {}", idReserva);
        ReservaDTO entity = reservaService.update(idReserva, reservaCreateDTO);
        log.info("Reserva atualizada com sucesso");
        return ResponseEntity.ok(createResponseMessage("Reserva atualizada com sucesso.", entity, "Reserva"));
    }

    /**
     * Cancela/Deleta uma reserva.
     */
    @DeleteMapping("/{idReserva}")
    public ResponseEntity<Map<String,Object>> deletar(@PathVariable Integer idReserva) throws RegraDeNegocioException {
        log.info("Cancelando reserva ID: {}", idReserva);
        reservaService.deletarReserva(idReserva);
        log.info("Reserva deletada com sucesso");
        return ResponseEntity.ok(messageResponse("Reserva deletada com sucesso."));
    }
}

