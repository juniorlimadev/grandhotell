package br.com.dbc.hotel.dto.reserva;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReservaDTO extends ReservaCreateDTO{

    private int idReserva;

    private String statusQuarto;
}
