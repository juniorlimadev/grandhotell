package br.com.dbc.hotel.dto.usuario;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UsuarioDTO extends UsuarioCreateDTO{
    private Integer idUsuario;

    private Set<String> cargos;
}
