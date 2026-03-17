package br.com.dbc.hotel.controller;

import br.com.dbc.hotel.dto.usuario.UsuarioCreateDTO;
import br.com.dbc.hotel.dto.usuario.UsuarioSenhaUpdateDTO;
import br.com.dbc.hotel.dto.usuario.UsuarioDTO;
import br.com.dbc.hotel.dto.custompage.CustomPageDTO;
import br.com.dbc.hotel.entity.Usuario;
import br.com.dbc.hotel.exceptions.NotFoundException;
import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import br.com.dbc.hotel.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
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

    /**
     * Lista todos os usuários cadastrados com paginação.
     */
    @GetMapping()
    public ResponseEntity<CustomPageDTO<UsuarioDTO>> listarTodos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nome") String sort) {
        log.info("Iniciando listagem de todos os usuários");
        CustomPageDTO<UsuarioDTO> usuariosPage = usuarioService.findAll(page, size, sort);
        log.info("Usuários listados com sucesso");
        return ResponseEntity.ok(usuariosPage);
    }

    /**
     * Busca um usuário específico pelo ID.
     */
    @GetMapping("/{idUsuario}")
    public ResponseEntity<Map<String, Object>> buscarPorId(@PathVariable Integer idUsuario) throws NotFoundException {
        log.info("Buscando usuário com ID: {}", idUsuario);
        Usuario usuario = usuarioService.findById(idUsuario);
        return ResponseEntity.ok(createResponseMessage("Usuário encontrado com sucesso", usuario, "Usuario"));
    }

    /**
     * Cadastra um novo usuário no sistema.
     */
    @PostMapping()
    public ResponseEntity<Map<String, Object>> salvar(@RequestBody @Valid UsuarioCreateDTO usuarioCreateDTO) throws RegraDeNegocioException {
        log.info("Criando novo usuário: {}", usuarioCreateDTO.getLogin());
        UsuarioDTO entity = usuarioService.save(usuarioCreateDTO);
        log.info("Usuário criado com sucesso");
        return ResponseEntity.status(HttpStatus.CREATED).body(createResponseMessage("Usuário criado com sucesso.", entity, "Usuario"));
    }

    /**
     * Atualiza os dados de um usuário existente.
     */
    @PutMapping("/{idUsuario}")
    public ResponseEntity<Map<String, Object>> atualizar(@PathVariable Integer idUsuario, @RequestBody @Valid UsuarioCreateDTO usuarioCreateDTO) throws RegraDeNegocioException {
        log.info("Atualizando usuário com ID: {}", idUsuario);
        UsuarioDTO entity = usuarioService.update(idUsuario, usuarioCreateDTO);
        log.info("Usuário atualizado com sucesso");
        return ResponseEntity.status(HttpStatus.OK).body(createResponseMessage("Usuário atualizado com sucesso.", entity, "Usuario"));
    }

    /**
     * Altera a senha de um usuário autenticado.
     */
    @PutMapping("/mudar-senha/{idUsuario}")
    @Operation(summary = "Mudar senha do usuário", description = "Recebe senha antiga e nova para atualizar")
    public ResponseEntity<Map<String, Object>> mudarSenha(@PathVariable Integer idUsuario, @RequestBody @Valid UsuarioSenhaUpdateDTO usuarioSenhaUpdateDTO) throws RegraDeNegocioException, NotFoundException {
        log.info("Alterando senha para o usuário ID: {}", idUsuario);
        usuarioService.updatePassword(idUsuario, usuarioSenhaUpdateDTO.getSenhaAntiga(), usuarioSenhaUpdateDTO.getNovaSenha());
        log.info("Senha alterada com sucesso");
        return ResponseEntity.ok(messageResponse("Senha atualizada com sucesso."));
    }

    /**
     * Remove um usuário do sistema.
     */
    @DeleteMapping("/{idUsuario}")
    public ResponseEntity<Map<String, Object>> deletar(@PathVariable Integer idUsuario) throws RegraDeNegocioException {
        log.info("Removendo usuário com ID: {}", idUsuario);
        usuarioService.delete(idUsuario);
        log.info("Usuário removido com sucesso");
        return ResponseEntity.ok(messageResponse("Usuário deletado com sucesso."));
    }
}


