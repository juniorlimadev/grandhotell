package br.com.dbc.hotel.dto.consumo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConsumoCreateDTO {
    @NotNull
    private Integer idReserva;

    private Integer idProduto;

    private String nomeProduto;

    private BigDecimal precoUnitario;

    @NotNull
    private Integer quantidade;
}
