package br.com.dbc.hotel.controller;

import br.com.dbc.hotel.dto.auth.LoginDTO;
import br.com.dbc.hotel.dto.auth.TokenDTO;
import br.com.dbc.hotel.entity.Usuario;
import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import br.com.dbc.hotel.security.TokenService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/auth")
@Tag(name = "Autenticação", description = "Endpoints para gerenciamento de autenticações")
public class AuthController{

    public final AuthenticationManager authenticationManager;
    private final TokenService tokenService;

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
        }
    }

}
