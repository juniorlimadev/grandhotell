package br.com.dbc.hotel.dto.consumo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ConsumoDTO extends ConsumoCreateDTO {
    private Integer idConsumo;
    private LocalDateTime dtConsumo;
}
