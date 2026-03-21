package br.com.dbc.hotel.service;

import br.com.dbc.hotel.dto.usuario.UsuarioCreateDTO;
import br.com.dbc.hotel.dto.usuario.UsuarioDTO;
import br.com.dbc.hotel.dto.custompage.CustomPageDTO;
import br.com.dbc.hotel.entity.Cargo;
import br.com.dbc.hotel.entity.Usuario;
import br.com.dbc.hotel.exceptions.NotFoundException;
import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import br.com.dbc.hotel.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço responsável pela gestão de usuários e segurança.
 * Gerencia o cadastro, autenticação, cargos e recuperação de senha.
 */
@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final CargoService cargoService;
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder;

    /**
     * Retorna uma lista paginada de todos os usuários.
     */
    public CustomPageDTO<UsuarioDTO> findAll(int page, int size, String sortField) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortField));
        Page<Usuario> usuarios = usuarioRepository.findAll(pageable);
        return retornarCustomPageDTO(usuarios);
    }

    /**
     * Busca um usuário pelo ID.
     */
    public Usuario findById(Integer id) throws NotFoundException {
        return usuarioRepository.findById(id).orElseThrow(() -> new NotFoundException(String.valueOf(id), "id"));
    }

    /**
     * Cadastra um novo usuário no sistema com criptografia de senha.
     */
    public UsuarioDTO save(UsuarioCreateDTO usuarioCreateDTO) throws RegraDeNegocioException {
        validarEmailUnico(usuarioCreateDTO.getEmail(), null);

        Usuario usuario = objectMapper.convertValue(usuarioCreateDTO, Usuario.class);
        usuario.setEmail(usuarioCreateDTO.getEmail().trim().toLowerCase());
        usuario.setSenha(passwordEncoder.encode(usuarioCreateDTO.getSenha()));
        
        // Atribui cargo básico "USER" por padrão
        Cargo userCargo = cargoService.findByName("USER");
        usuario.setCargos(new HashSet<>(Collections.singletonList(userCargo)));

        Usuario save = usuarioRepository.save(usuario);
        return entidadeParaDTO(save);
    }

    /**
     * Cadastra ou atualiza um usuário vindo do Google Auth.
     */
    public Usuario saveGoogleUser(String email, String nome) throws RegraDeNegocioException {
        Optional<Usuario> usuarioOptional = usuarioRepository.findByEmail(email.trim().toLowerCase());
        
        if (usuarioOptional.isPresent()) {
            return usuarioOptional.get();
        }

        Usuario novoUsuario = new Usuario();
        novoUsuario.setNome(nome);
        novoUsuario.setEmail(email.trim().toLowerCase());
        // Senha aleatória para usuários Google (eles não a usarão)
        novoUsuario.setSenha(passwordEncoder.encode(UUID.randomUUID().toString()));
        novoUsuario.setDataNascimento(new Date()); // Data padrão
        
        Cargo userCargo = cargoService.findByName("USER");
        novoUsuario.setCargos(new HashSet<>(Collections.singletonList(userCargo)));

        return usuarioRepository.save(novoUsuario);
    }

    /**
     * Atualiza os dados de um usuário existente.
     */
    public UsuarioDTO update(Integer id, UsuarioCreateDTO usuarioCreateDTO) throws RegraDeNegocioException {
        Usuario usuario = findById(id);
        validarEmailUnico(usuarioCreateDTO.getEmail(), id);

        usuario.setNome(usuarioCreateDTO.getNome());
        usuario.setEmail(usuarioCreateDTO.getEmail().trim().toLowerCase());
        usuario.setDataNascimento(usuarioCreateDTO.getDataNascimento());

        if (usuarioCreateDTO.getSenha() != null && !usuarioCreateDTO.getSenha().isEmpty()) {
            usuario.setSenha(passwordEncoder.encode(usuarioCreateDTO.getSenha()));
        }

        // Atualização de Cargos
        if (usuarioCreateDTO.getCargos() != null && !usuarioCreateDTO.getCargos().isEmpty()) {
            Set<Cargo> novosCargos = usuarioCreateDTO.getCargos().stream()
                    .map(cargoService::findByName)
                    .collect(Collectors.toSet());
            usuario.setCargos(novosCargos);
        }

        Usuario save = usuarioRepository.save(usuario);
        return entidadeParaDTO(save);
    }

    /**
     * Remove um usuário do sistema.
     */
    public void delete(Integer id) throws RegraDeNegocioException {
        Usuario usuario = findById(id);
        usuarioRepository.delete(usuario);
    }

    /**
     * Atualiza a senha de um usuário autenticado.
     */
    public void updatePassword(Integer id, String senhaAntiga, String novaSenha) throws RegraDeNegocioException, NotFoundException {
        Usuario usuario = findById(id);
        if (!passwordEncoder.matches(senhaAntiga, usuario.getSenha())) {
            throw new RegraDeNegocioException("Senha antiga incorreta.", HttpStatus.BAD_REQUEST);
        }
        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);
    }

    /**
     * Busca um usuário pelo e-mail (login).
     */
    public Optional<Usuario> findByLogin(String email) {
        return usuarioRepository.findByEmail(email);
    }

    // --- Métodos de Conversão e Validação ---

    private void validarEmailUnico(String email, Integer idParaIgnorar) throws RegraDeNegocioException {
        Optional<Usuario> existente = usuarioRepository.findByEmail(email);
        if (existente.isPresent() && !existente.get().getIdUsuario().equals(idParaIgnorar)) {
            throw new RegraDeNegocioException("Este e-mail já está em uso.", HttpStatus.BAD_REQUEST);
        }
    }

    private UsuarioDTO entidadeParaDTO(Usuario usuario) {
        UsuarioDTO dto = objectMapper.convertValue(usuario, UsuarioDTO.class);
        
        // Removida cópia de foto manual por performance

        if (usuario.getCargos() != null) {
            dto.setCargos(usuario.getCargos().stream()
                    .map(Cargo::getTitulo)
                    .collect(Collectors.toSet()));
        }
        return dto;
    }

    private CustomPageDTO<UsuarioDTO> retornarCustomPageDTO(Page<Usuario> page) {
        return new CustomPageDTO<>(page.map(this::entidadeParaDTO));
    }
}


