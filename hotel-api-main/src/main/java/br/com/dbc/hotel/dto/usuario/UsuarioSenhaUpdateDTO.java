package br.com.dbc.hotel.dto.usuario;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class UsuarioSenhaUpdateDTO {

    @NotBlank
    @Schema(description = "Senha antiga do usuário para verificação")
    private String senhaAntiga;

    @NotBlank
    @Size(min = 6, message = "A nova senha deve ter no mínimo 6 caracteres")
    @Schema(description = "Nova senha do usuário")
    private String novaSenha;
}
