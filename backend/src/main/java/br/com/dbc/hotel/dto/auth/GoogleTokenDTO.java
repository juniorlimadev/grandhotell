package br.com.dbc.hotel.dto.auth;

import lombok.Data;
import javax.validation.constraints.NotBlank;

@Data
public class GoogleTokenDTO {
    @NotBlank
    private String token;
}
