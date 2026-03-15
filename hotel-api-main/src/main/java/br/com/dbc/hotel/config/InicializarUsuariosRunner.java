package br.com.dbc.hotel.config;

import br.com.dbc.hotel.entity.Cargo;
import br.com.dbc.hotel.entity.Usuario;
import br.com.dbc.hotel.repository.UsuarioRepository;
import br.com.dbc.hotel.service.CargoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Set;

/**
 * Cria usuários iniciais para login quando a tabela está vazia.
 * Senha de todos: senha123
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Profile("cloud")
public class InicializarUsuariosRunner implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final CargoService cargoService;

    private static final String SENHA_PADRAO = "senha123";

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            log.info("Já existem usuários no banco. Não criando usuários iniciais.");
            return;
        }

        Pbkdf2PasswordEncoder encoder = new Pbkdf2PasswordEncoder();
        String senhaHash = encoder.encode(SENHA_PADRAO);

        try {
            Cargo cargoUser = cargoService.findByName("USER");
            Cargo cargoAdmin = cargoService.findByName("ADMIN");

            // Admin (acesso total)
            Usuario admin = new Usuario();
            admin.setNome("Administrador");
            admin.setEmail("admin@hotel.com");
            admin.setSenha(senhaHash);
            admin.setDataNascimento(LocalDate.of(1990, 1, 1));
            admin.setCargos(Set.of(cargoUser, cargoAdmin));
            usuarioRepository.save(admin);
            log.info("Usuário criado: admin@hotel.com (senha: {})", SENHA_PADRAO);

            // Usuário comum
            Usuario user = new Usuario();
            user.setNome("Maria Silva");
            user.setEmail("maria@hotel.com");
            user.setSenha(senhaHash);
            user.setDataNascimento(LocalDate.of(1995, 5, 15));
            user.setCargos(Set.of(cargoUser));
            usuarioRepository.save(user);
            log.info("Usuário criado: maria@hotel.com (senha: {})", SENHA_PADRAO);

            // Segundo usuário comum
            Usuario user2 = new Usuario();
            user2.setNome("João Santos");
            user2.setEmail("joao@hotel.com");
            user2.setSenha(senhaHash);
            user2.setDataNascimento(LocalDate.of(1988, 10, 20));
            user2.setCargos(Set.of(cargoUser));
            usuarioRepository.save(user2);
            log.info("Usuário criado: joao@hotel.com (senha: {})", SENHA_PADRAO);

        } catch (Exception e) {
            log.error("Erro ao criar usuários iniciais: {}", e.getMessage());
        }
    }
}
