package br.com.dbc.hotel.exceptions;

import org.springframework.http.HttpStatus;

public class NotFoundException extends RegraDeNegocioException{
    public NotFoundException(String campo, String nomeCampo) {
        super("%s: %s não encontrado", HttpStatus.NOT_FOUND, campo, nomeCampo);
    }

}
