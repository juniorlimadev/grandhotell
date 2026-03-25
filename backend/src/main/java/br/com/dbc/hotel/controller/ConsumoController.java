package br.com.dbc.hotel.controller;

import br.com.dbc.hotel.dto.consumo.ConsumoCreateDTO;
import br.com.dbc.hotel.dto.consumo.ConsumoDTO;
import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import br.com.dbc.hotel.service.ConsumoService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/consumo")
@Validated
@RequiredArgsConstructor
public class ConsumoController {
    private final ConsumoService consumoService;

    @Operation(summary = "Lista consumo por reserva")
    @GetMapping("/reserva/{idReserva}")
    public ResponseEntity<List<ConsumoDTO>> listByReserva(@PathVariable("idReserva") Integer idReserva) {
        return new ResponseEntity<>(consumoService.listByReserva(idReserva), HttpStatus.OK);
    }

    @Operation(summary = "Lança consumo para uma reserva")
    @PostMapping
    public ResponseEntity<ConsumoDTO> create(@Valid @RequestBody ConsumoCreateDTO createDTO) throws RegraDeNegocioException {
        return new ResponseEntity<>(consumoService.create(createDTO), HttpStatus.CREATED);
    }
}
