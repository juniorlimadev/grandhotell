package br.com.dbc.hotel.dto.quarto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class QuartoCreateDTO {

    @Schema(example = "Nome do Quarto")
    @NotBlank(message = "O nome não pode ser vazio")
    @NotNull(message = "O nome não pode ser nulo")
    @Size(max = 25, message = "Nome de Quarto não pode ser maior que 25 caracteres.")
    @Pattern(regexp = "^[\\p{L}0-9 ,^'`´~]+$", message = "O nome de Quarto não pode conter caracteres especiais.")
    private String nome;

    @Schema(example = "Ala do Quarto")
    @NotNull(message = "Ala não pode ser nulo")
    @Pattern(regexp = "ALTA|MEDIA|BAIXA", message = "Ala inválida: Deve ser ALTA, MEDIA ou BAIXA")
    private String alaHotel;
}
