package br.com.dbc.hotel.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginDTO {

    @Schema(example = "Email do usuário")
    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "E-mail inválido")
    @NotNull
    private String login;

    @Schema(example = "Senha do usuário")
    @NotNull
    @NotBlank(message = "A senha é obrigatória")
    private String senha;
}
