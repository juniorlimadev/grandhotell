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

    @GetMapping("/quarto/{idQuarto}")
    public ResponseEntity<Map<String, Object>> retornarUsuarioPorIdQuarto(@PathVariable Integer idQuarto){
        List<Reserva> reservas = reservaService.buscarReservasPorQuarto(idQuarto);
        return ResponseEntity.ok(createResponseMessage("Reservas por quarto encontrado com sucesso", reservas, "Reservas"));
    }

    @PostMapping()
    public ResponseEntity<Map<String, Object>> adicionarUsuario(@RequestBody @Valid ReservaCreateDTO reservaCreateDTO) throws RegraDeNegocioException {
        log.info("Criando novo Quarto");
        ReservaDTO entity = reservaService.save(reservaCreateDTO);
        log.info("Quarto criado com sucesso");
        return ResponseEntity.status(HttpStatus.CREATED).body(createResponseMessage("Reserva criada com sucesso.", entity, "Reserva"));
    }

    @GetMapping("/quartos-ocupados")
    public ResponseEntity<List<ReservaDTO>> buscarReservasPorIntervalo(
            @RequestParam("dtInicio") @DateTimeFormat(pattern = "dd-MM-yyyy") LocalDate dtInicio,
            @RequestParam("dtFim") @DateTimeFormat(pattern = "dd-MM-yyyy") LocalDate dtFim) throws RegraDeNegocioException {

        List<ReservaDTO> reservas = reservaService.buscarReservasPorIntervalo(dtInicio, dtFim);

        return ResponseEntity.ok(reservas);
    }

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

        return reservaService.buscarQuartosLivresPorAlaEData(page, size, sortField, sortDirection, ala, dtInicio, dtFim);
    }

    @GetMapping("/{idReserva}")
    public ResponseEntity<Map<String,Object>> buscarReservaPorId(@PathVariable Integer idReserva) throws NotFoundException {
        Reserva byId = reservaService.findById(idReserva);
        return ResponseEntity.ok(createResponseMessage("Reserva encontrada", byId, "Reserva"));
    }

    @GetMapping("/usuario/{nomeUsuario}")
    public ResponseEntity<Map<String,Object>> buscarUsuarioPorId(@PathVariable String nomeUsuario){
        List<ReservaDTO> reservaDTOS = reservaService.buscarReservasPorNomeUsuario(nomeUsuario);
        return ResponseEntity.ok(createResponseMessage("Reserva encontrada", reservaDTOS, "Reservas"));
    }

    @DeleteMapping("/{idReserva}")
    public ResponseEntity<Map<String,Object>> deletarReserva(@PathVariable Integer idReserva) throws RegraDeNegocioException {
        reservaService.deletarReserva(idReserva);
        return ResponseEntity.ok(messageResponse("Reserva deletada com sucesso."));
    }
}
