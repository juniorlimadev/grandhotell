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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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
@Slf4j
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final CargoService cargoService;
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

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
     * Cadastra um novo usuário do staff no sistema com criptografia de senha.
     * Atribui o cargo básico "USER" por padrão.
     */
    public UsuarioDTO save(UsuarioCreateDTO usuarioCreateDTO) throws RegraDeNegocioException {
        validarEmailUnico(usuarioCreateDTO.getEmail(), null);

        Usuario usuario = objectMapper.convertValue(usuarioCreateDTO, Usuario.class);
        usuario.setEmail(usuarioCreateDTO.getEmail().trim().toLowerCase());
        usuario.setSenha(passwordEncoder.encode(usuarioCreateDTO.getSenha()));
        usuario.setAtivo(true);
        
        // Atribui cargo básico "USER" por padrão para usuários do staff
        Cargo userCargo = cargoService.findByName("USER");
        usuario.setCargos(new HashSet<>(Collections.singletonList(userCargo)));

        Usuario save = usuarioRepository.save(usuario);
        return entidadeParaDTO(save);
    }

    /**
     * Cadastra um novo CLIENTE no sistema.
     * Atribui o cargo "CLIENTE" que distingue de usuários do staff (USER/ADMIN).
     */
    public UsuarioDTO saveCliente(UsuarioCreateDTO usuarioCreateDTO) throws RegraDeNegocioException {
        validarEmailUnico(usuarioCreateDTO.getEmail(), null);

        Usuario usuario = objectMapper.convertValue(usuarioCreateDTO, Usuario.class);
        usuario.setEmail(usuarioCreateDTO.getEmail().trim().toLowerCase());
        usuario.setSenha(passwordEncoder.encode(usuarioCreateDTO.getSenha()));
        usuario.setAtivo(true);

        // Clientes recebem o cargo "CLIENTE", separando-os do staff
        Cargo clienteCargo = cargoService.findByName("CLIENTE");
        usuario.setCargos(new HashSet<>(Collections.singletonList(clienteCargo)));

        Usuario save = usuarioRepository.save(usuario);
        return entidadeParaDTO(save);
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
     * Solicita recuperação de senha e envia email real ao usuário com senha temporária.
     */
    public void solicitarRecuperacaoSenha(String email) throws RegraDeNegocioException {
        // Busca o usuário - se não existir, simplesmente retorna sem erro
        // (não revelamos se o email existe por segurança)
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email.trim().toLowerCase());
        if (usuarioOpt.isEmpty()) {
            log.warn("Tentativa de recuperação de senha para e-mail não cadastrado: {}", email);
            return; // Retorna silenciosamente
        }
        
        Usuario usuario = usuarioOpt.get();
        log.info("Solicitando recuperação de senha para: {}", email);

        // Gera nova senha temporária e salva SEMPRE, independente do email
        String novaSenhaTemp = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        usuario.setSenha(passwordEncoder.encode(novaSenhaTemp));
        usuarioRepository.save(usuario);
        log.info("Nova senha temporária gerada para: {} | Senha: {}", email, novaSenhaTemp);

        try {
            SimpleMailMessage mensagem = new SimpleMailMessage();
            mensagem.setTo(email);
            mensagem.setSubject("Grand Hotel — Recuperação de Senha");
            mensagem.setText(
                "Olá, " + usuario.getNome() + "!\n\n" +
                "Sua nova senha temporária é: " + novaSenhaTemp + "\n\n" +
                "Acesse o sistema e altere sua senha após o login.\n\n" +
                "Atenciosamente,\nEquipe Grand Hotel"
            );
            mailSender.send(mensagem);
            log.info("E-mail de recuperação enviado com sucesso para: {}", email);
        } catch (Exception e) {
            // SMTP falhou (configuração ausente ou erro de rede)
            // Não bloqueamos o fluxo - a senha já foi alterada no banco
            log.error("SMTP indisponível para {}. Senha nova: {}. Erro: {}", email, novaSenhaTemp, e.getMessage());
            // Não lança exceção - retorna sucesso mesmo assim
        }
    }

    public void toggleStatus(Integer id) throws NotFoundException {
        Usuario usuario = findById(id);
        usuario.setAtivo(usuario.getAtivo() == null || !usuario.getAtivo());
        usuarioRepository.save(usuario);
    }

    public void adminMudarSenha(Integer idUsuario, String novaSenha) throws NotFoundException {
        Usuario usuario = findById(idUsuario);
        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);
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
