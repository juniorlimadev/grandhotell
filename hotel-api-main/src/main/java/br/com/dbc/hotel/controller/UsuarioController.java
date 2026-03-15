package br.com.dbc.hotel.controller;

import br.com.dbc.hotel.dto.usuario.UsuarioCreateDTO;
import br.com.dbc.hotel.dto.usuario.UsuarioDTO;
import br.com.dbc.hotel.dto.custompage.CustomPageDTO;
import br.com.dbc.hotel.entity.Usuario;
import br.com.dbc.hotel.exceptions.NotFoundException;
import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import br.com.dbc.hotel.service.UsuarioService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

import static br.com.dbc.hotel.utils.CreateResponse.createResponseMessage;
import static br.com.dbc.hotel.utils.CreateResponse.messageResponse;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/usuario")
@Tag(name = "Usuário", description = "Endpoints para gerenciamento de usuários")
public class UsuarioController {
    private final UsuarioService usuarioService;

    @GetMapping()
    public ResponseEntity<CustomPageDTO<UsuarioDTO>> encontrarTodosUsuarios(@RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "10") int size,
                                                       @RequestParam(defaultValue = "nome") String sort){
        log.info("Listando todos usuarios");
        CustomPageDTO<UsuarioDTO> usuariosPage = usuarioService.findAll(page, size, sort);
        log.info("Usuarios listados com sucesso");
        return ResponseEntity.ok(usuariosPage);
    }
    @GetMapping("/{idUsuario}")
    public ResponseEntity<Map<String, Object>> retornarUsuarioPorId(@PathVariable Integer idUsuario) throws NotFoundException {
        Usuario usuario = usuarioService.findById(idUsuario);
        return ResponseEntity.ok(createResponseMessage("Usuario encontrado com sucesso", usuario, "Usuario"));
    }

    @PostMapping()
    public ResponseEntity<Map<String, Object>> adicionarUsuario(@RequestBody @Valid UsuarioCreateDTO usuarioCreateDTO) throws RegraDeNegocioException {
        log.info("Criando novo Usuario");
        UsuarioDTO entity = usuarioService.save(usuarioCreateDTO);
        log.info("Usuario criado com sucesso");
        return ResponseEntity.status(HttpStatus.CREATED).body(createResponseMessage("Usuario criado com sucesso.", entity, "Usuario"));
    }

    @PutMapping("/{idUsuario}")
    public ResponseEntity<Map<String, Object>> atualizarUsuario(@PathVariable Integer idUsuario, @RequestBody @Valid UsuarioCreateDTO usuarioCreateDTO) throws RegraDeNegocioException {
        log.info("Criando novo Usuario");
        UsuarioDTO entity = usuarioService.update(idUsuario, usuarioCreateDTO);
        log.info("Usuario criado com sucesso");
        return ResponseEntity.status(HttpStatus.CREATED).body(createResponseMessage("Usuario atualizado com sucesso.", entity, "Usuario"));
    }

    @DeleteMapping("/{idUsuario}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Integer idUsuario) throws RegraDeNegocioException {
        log.info("Deletando Usuario com ID {}", idUsuario);
        usuarioService.delete(idUsuario);
        log.info("Usuario deletado com sucesso");
        return ResponseEntity.ok(messageResponse("Usuario deletado com sucesso."));
    }
}
