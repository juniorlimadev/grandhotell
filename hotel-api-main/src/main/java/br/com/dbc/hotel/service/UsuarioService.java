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
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;
import org.springframework.stereotype.Service;


import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final CargoService cargoService;
    private final ObjectMapper objectMapper;

    public CustomPageDTO<UsuarioDTO> findAll(int page, int size, String sortField) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortField));
        Page<Usuario> usuarios = usuarioRepository.findAll(pageable);
        return retornarCustomPageDTO(usuarios);
    }

    public Usuario findById(Integer id) throws NotFoundException {
        Optional<Usuario> usuario = usuarioRepository.findById(id);
        return usuario.orElseThrow(() -> new NotFoundException(String.valueOf(id), "id"));

    }

    public UsuarioDTO save(UsuarioCreateDTO usuarioCreateDTO) throws RegraDeNegocioException {
        Usuario usuario = objectMapper.convertValue(usuarioCreateDTO, Usuario.class);
        List<Usuario> todosUsuarios = usuarioRepository.findAll();
        boolean emailExiste = todosUsuarios.stream().anyMatch(usuarios -> usuarios.getEmail().equalsIgnoreCase(usuarioCreateDTO.getEmail()));
        if (emailExiste){
            throw new RegraDeNegocioException("Já existe um usuário com este email cadastrado.", HttpStatus.BAD_REQUEST);
        }
        String emailLower = usuario.getEmail().trim().toLowerCase();
        usuario.setEmail(emailLower);
        Pbkdf2PasswordEncoder encoder = new Pbkdf2PasswordEncoder();
        usuario.setSenha(encoder.encode(usuarioCreateDTO.getSenha()));
        usuario.setDataNascimento(usuarioCreateDTO.getDataNascimento());

        Cargo user = cargoService.findByName("USER");

        Set<Cargo> cargos = usuario.getCargos();
        if (cargos == null) {
            cargos = new HashSet<>();
            usuario.setCargos(cargos);
        } else {
            cargos.add(user);
        }

        Usuario save = usuarioRepository.save(usuario);
        UsuarioDTO usuarioDTO = objectMapper.convertValue(save, UsuarioDTO.class);
        atualizarUsuarioColunasExternas(usuario, usuarioDTO);
        return usuarioDTO;
    }

    public UsuarioDTO update(Integer id, UsuarioCreateDTO usuarioCreateDTO) throws RegraDeNegocioException {
        Usuario usuario = findById(id);

        List<Usuario> todosUsuarios = usuarioRepository.findAll();
        boolean emailExiste = todosUsuarios.stream()
                .anyMatch(usuarios -> !usuarios.getIdUsuario().equals(id) && usuarios.getEmail().equalsIgnoreCase(usuarioCreateDTO.getEmail()));

         if (emailExiste) {
            throw new RegraDeNegocioException("Já existe um usuário com este email cadastrado.", HttpStatus.BAD_REQUEST);
        }

        String emailLower = usuarioCreateDTO.getEmail().trim().toLowerCase();
        usuario.setEmail(emailLower);

        if (usuarioCreateDTO.getSenha() != null && !usuarioCreateDTO.getSenha().isEmpty()) {
            Pbkdf2PasswordEncoder encoder = new Pbkdf2PasswordEncoder();
            usuario.setSenha(encoder.encode(usuarioCreateDTO.getSenha()));
        }
        usuario.setDataNascimento(usuarioCreateDTO.getDataNascimento());
        Cargo user = cargoService.findByName("USER");
        Set<Cargo> cargos = usuario.getCargos();
        if (cargos == null) {
            cargos = new HashSet<>();
            usuario.setCargos(cargos);
        } else {
            cargos.add(user);
        }

        cargos.add(user);
        usuario.setNome(usuarioCreateDTO.getNome());

        Usuario save = usuarioRepository.save(usuario);
        UsuarioDTO usuarioDTO = objectMapper.convertValue(save, UsuarioDTO.class);
        atualizarUsuarioColunasExternas(usuario, usuarioDTO);
        return usuarioDTO;
    }

    public void delete(Integer id) throws RegraDeNegocioException {
        Usuario usuario = findById(id);
        usuarioRepository.delete(usuario);
    }





    public void atualizarUsuarioColunasExternas(Usuario usuario, UsuarioDTO usuarioDTO) throws RegraDeNegocioException {
        if(usuario.getCargos() != null){
            usuarioDTO.setCargos(
                    (Optional.of(usuario.getCargos())
                    .orElse(Collections.emptySet())
                    .stream()
                    .map(Cargo::getTitulo)
                    .collect(Collectors.toSet())
            ));
        }
    }

    public CustomPageDTO<UsuarioDTO> retornarCustomPageDTO(Page<Usuario> usuarioPage) {
        Page<UsuarioDTO> usuarioDTOPage = usuarioPage.map(usuario -> {
            UsuarioDTO usuarioDTO = objectMapper.convertValue(usuario, UsuarioDTO.class);
            try {
                atualizarUsuarioColunasExternas(usuario, usuarioDTO);
            } catch (RegraDeNegocioException e) {
                throw new RuntimeException(e);
            }
            return usuarioDTO;
        });

        return new CustomPageDTO<>(usuarioDTOPage);
    }

    public Optional<Usuario> findByLogin(String email) {
        return usuarioRepository.findByEmail(email);
    }

}
