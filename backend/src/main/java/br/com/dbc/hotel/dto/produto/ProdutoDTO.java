package br.com.dbc.hotel.dto.produto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ProdutoDTO extends ProdutoCreateDTO {
    private Integer idProduto;
    private Boolean ativo;
}
