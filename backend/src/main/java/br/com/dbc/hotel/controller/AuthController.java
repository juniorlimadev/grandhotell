package br.com.dbc.hotel.controller;

import br.com.dbc.hotel.dto.auth.LoginDTO;
import br.com.dbc.hotel.dto.auth.TokenDTO;
import br.com.dbc.hotel.entity.Usuario;
import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import br.com.dbc.hotel.security.TokenService;
import br.com.dbc.hotel.service.UsuarioService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@RestController
@Validated
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/auth")
@Tag(name = "Autenticação", description = "Endpoints para gerenciamento de autenticações")
public class AuthController{

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final UsuarioService usuarioService;

    @PostMapping("/esqueci-senha")
    public ResponseEntity<Void> esqueciSenha(@RequestBody Map<String, String> payload) throws RegraDeNegocioException {
        String email = payload.get("email");
        log.info("Solicitação de recuperação de senha para: {}", email);
        usuarioService.solicitarRecuperacaoSenha(email);
        return ResponseEntity.ok().build();
    }


    @PostMapping
    public ResponseEntity<TokenDTO> auth(@RequestBody @Valid LoginDTO loginDTO) throws Exception {
        try {
            UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken =
                    new UsernamePasswordAuthenticationToken(
                            loginDTO.getLogin(),
                            loginDTO.getSenha()
                    );
            Authentication authentication;

                authentication =
                        authenticationManager.authenticate(usernamePasswordAuthenticationToken);

            Usuario usuarioValidado = (Usuario) authentication.getPrincipal();

            TokenDTO tokenDTO = new TokenDTO();
            tokenDTO.setToken(tokenService.generateToken(usuarioValidado));

            return new ResponseEntity<>(tokenDTO, HttpStatus.OK);

        } catch (BadCredentialsException e) {
            throw new RegraDeNegocioException("E-mail ou senha inválidos. Tente novamente.", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            // Evita mensagem genérica de "erro interno" quando o problema for temporário
            // (ex: indisponibilidade/intermitência do banco no plano free).
            log.error("Falha ao autenticar usuário: {}", loginDTO.getLogin(), e);
            throw new RegraDeNegocioException(
                    "Não foi possível autenticar agora. Tente novamente em instantes.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
    }

}
