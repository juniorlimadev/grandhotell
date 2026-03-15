package br.com.dbc.hotel.dto.usuario;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UsuarioCreateDTO {

    @Schema(example = "Nome do Usuario")
    @NotBlank(message = "O nome não pode ser vazio")
    @NotNull(message = "O nome não pode ser nulo")
    @Size(max = 50, message = "Nome de usuário não pode ser maior que 50 caracteres.")
    @Pattern(regexp = "^[\\p{L}0-9 ,^'`´~]+$", message = "O nome de usuário  não pode conter caracteres especiais.")
    private String nome;

    @Schema(example = "Email do Usuario")
    @NotBlank(message = "O email não pode ser vazio")
    @NotNull(message = "O email não pode ser nulo")
    @Size(max = 50, message = "Email de usuário não pode ser maior que 50 caracteres.")
    @Pattern(regexp = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$", message = "Email inválido.")
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Schema(example = "Senha do Usuario")
    @NotBlank(message = "A senha não pode ser vazio")
    @NotNull(message = "A senha não pode ser nulo")
    private String senha;

    @Schema(type = "string", example = "10-10-2005", pattern = "dd-MM-yyyy")
    @NotNull(message = "A data nascimento não pode ser nulo")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern="dd-MM-yyyy")
    private LocalDate dataNascimento;
}
