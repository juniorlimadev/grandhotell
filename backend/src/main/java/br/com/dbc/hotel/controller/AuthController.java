package br.com.dbc.hotel.controller;

import br.com.dbc.hotel.dto.auth.GoogleTokenDTO;
import br.com.dbc.hotel.dto.auth.LoginDTO;
import br.com.dbc.hotel.dto.auth.TokenDTO;
import br.com.dbc.hotel.entity.Usuario;
import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import br.com.dbc.hotel.security.TokenService;
import br.com.dbc.hotel.service.UsuarioService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.Collections;

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

    @Value("${google.client.id:75470123545-un0000000000000000000000000.apps.googleusercontent.com}")
    private String googleClientId;

    @PostMapping("/google")
    public ResponseEntity<TokenDTO> authGoogle(@RequestBody @Valid GoogleTokenDTO googleTokenDTO) throws Exception {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(googleTokenDTO.getToken());
            if (idToken == null) {
                throw new RegraDeNegocioException("Token Google inválido.", HttpStatus.BAD_REQUEST);
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            Usuario usuario = usuarioService.saveGoogleUser(email, name);

            TokenDTO tokenDTO = new TokenDTO();
            tokenDTO.setToken(tokenService.generateToken(usuario));

            return new ResponseEntity<>(tokenDTO, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Erro ao autenticar com Google: ", e);
            throw new RegraDeNegocioException("Falha na autenticação Google. Tente novamente.", HttpStatus.UNAUTHORIZED);
        }
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
