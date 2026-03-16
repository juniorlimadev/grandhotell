package br.com.dbc.hotel.security;

import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import io.jsonwebtoken.*;
import br.com.dbc.hotel.entity.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TokenService {
    private static final String TOKEN_PREFIX = "Bearer";

    private static final String CARGOS_CLAIM = "cargos";

    @Value("${jwt.expiration}")
    private String expiration;

    @Value("${jwt.secret}")
    private String secret;


    public String generateToken(Usuario usuario) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + Long.parseLong(expiration));

        List<String> cargos = usuario.getCargos().stream()
                .map(cargo -> "ROLE_" + cargo.getAuthority())
                .toList();

        return TOKEN_PREFIX + " " +
                Jwts.builder()
                        .setIssuer("hotel-api")
                        .setSubject(usuario.getEmail())
                        .claim("nome", usuario.getNome())
                        .claim("id", usuario.getIdUsuario())
                        .claim("fotoUrl", usuario.getFotoUrl())
                        .claim(CARGOS_CLAIM, cargos)
                        .setIssuedAt(now)
                        .setExpiration(exp)
                        .signWith(SignatureAlgorithm.HS256, secret)
                        .compact();
    }

    public UsernamePasswordAuthenticationToken isValid(String token) throws RegraDeNegocioException {
        try {
            if (token == null || token.trim().isEmpty()) {
                throw new RegraDeNegocioException("Token invalido! Um token valido deve ser fornecido.", HttpStatus.BAD_REQUEST);
            }

            Claims body = Jwts.parser()
                    .setSigningKey(secret)
                    .parseClaimsJws(token.replace(TOKEN_PREFIX, ""))
                    .getBody();

            Object idObj = body.get("id");
            if (idObj == null) {
                return null;
            }

            String user = idObj.toString();
            Object cargosClaim = body.get(CARGOS_CLAIM);
            List<String> cargos = new java.util.ArrayList<>();
            if (cargosClaim instanceof List<?>) {
                for (Object item : (List<?>) cargosClaim) {
                    if (item instanceof String) {
                        cargos.add((String) item);
                    }
                }
            }


            List<SimpleGrantedAuthority> authorities = cargos.stream()
                    .map(SimpleGrantedAuthority::new)
                    .toList();

            return new UsernamePasswordAuthenticationToken(user, null, authorities);

        } catch (ExpiredJwtException e) {
            throw new AuthenticationCredentialsNotFoundException("Token expirado");
        } catch (MalformedJwtException | SignatureException | IllegalArgumentException e) {
            throw new AuthenticationCredentialsNotFoundException("Token inválido");
        }
    }
}
