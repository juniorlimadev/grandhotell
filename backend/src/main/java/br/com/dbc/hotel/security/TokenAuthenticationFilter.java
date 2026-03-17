package br.com.dbc.hotel.security;

import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RequiredArgsConstructor
public class TokenAuthenticationFilter extends OncePerRequestFilter {
    private final TokenService tokenService;
    private final String BEARER = "Bearer ";
    private final ObjectMapper objectMapper;

    @Value("${jwt.secret}")
    private String secret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (request.getRequestURI().startsWith("/auth")){
            filterChain.doFilter(request, response);
            return;
        }

        if (request.getRequestURI().matches("/usuario") && request.getMethod().equals("POST")) {
            filterChain.doFilter(request, response);
            return;
        }

        String tokenFromHeader = getTokenFromHeader(request);
        if (tokenFromHeader == null || tokenFromHeader.isEmpty()) {
            respondUnauthorized(response, "Token não fornecido ou inválido");
            return;
        }

        if (countOccurrences(tokenFromHeader, '.') != 2) {
            respondUnauthorized(response, "Token JWT malformado");
            return;
        }

        UsernamePasswordAuthenticationToken usuarioEntity = null;
        try {
            usuarioEntity = tokenService.isValid(tokenFromHeader);

            if (usuarioEntity == null) {
                respondUnauthorized(response, "Token inválido");
                return;
            }

            SecurityContextHolder.getContext().setAuthentication(usuarioEntity);
        } catch (ExpiredJwtException | SignatureException | MalformedJwtException e) {
            respondUnauthorized(response, traduzirMensagemErro(e.getMessage()));
            return;
        } catch (RegraDeNegocioException e) {
            throw new RuntimeException(e);
        }

        filterChain.doFilter(request, response);
    }

    private void respondUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401 Unauthorized

        Map<String, Object> errorResponse = new LinkedHashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpServletResponse.SC_UNAUTHORIZED);
        errorResponse.put("error", "Unauthorized");
        errorResponse.put("message", message);

        response.setContentType("application/json");
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }

    private String getTokenFromHeader(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token == null) {
            return null;
        }
        return token.replace(BEARER, "").trim();
    }

    // Conta quantas vezes um caractere aparece em uma string
    private int countOccurrences(String str, char character) {
        return (int) str.chars().filter(ch -> ch == character).count();
    }

    private String traduzirMensagemErro(String mensagem) {
        if (mensagem.contains("JWT expired")) {
            return "Token expirado";
        }
        if (mensagem.contains("JWT signature does not match")) {
            return "A assinatura do token não corresponde";
        }
        if (mensagem.contains("JWT strings must contain exactly 2 period characters")) {
            return "Token JWT malformado";
        }
        if (mensagem.contains("Allowed clock skew")) {
            return "Divergência no tempo do servidor";
        }
        return "Token inválido: " + mensagem; // Caso não tenha mapeamento, retorna o erro original.
    }
}
