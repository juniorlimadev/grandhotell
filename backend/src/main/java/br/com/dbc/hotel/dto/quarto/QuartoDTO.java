package br.com.dbc.hotel.dto.quarto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class QuartoDTO extends QuartoCreateDTO{
    private int idQuarto;
}
