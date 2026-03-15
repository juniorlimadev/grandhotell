package br.com.dbc.hotel.dto.reserva;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReservaCreateDTO {
    @NotNull(message = "O idUsuario não pode ser nulo")
    @Min(value = 1, message = "O idUsuario não pode ser negativo ou zero")
    private Integer idUsuario;

    @NotNull(message = "O idQuarto não pode ser nulo")
    @Min(value = 1, message = "O idQuarto não pode ser negativo ou zero")
    private Integer idQuarto;

    @Schema(type = "string", example = "10-10-2005", pattern = "dd-MM-yyyy")
    @NotNull(message = "A data de inicio não pode ser nulo")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern="dd-MM-yyyy")
    private LocalDate dtInicio;

    @Schema(type = "string", example = "10-10-2005", pattern = "dd-MM-yyyy")
    @NotNull(message = "A data de fim não pode ser nulo")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern="dd-MM-yyyy")
    private LocalDate dtFim;
}
