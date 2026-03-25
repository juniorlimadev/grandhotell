package br.com.dbc.hotel.dto.produto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProdutoCreateDTO {
    @NotBlank
    private String nome;

    @NotNull
    private BigDecimal preco;

    private String categoria;
    private String icone;
}
