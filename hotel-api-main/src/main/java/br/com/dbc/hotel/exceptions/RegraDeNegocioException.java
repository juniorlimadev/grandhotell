package br.com.dbc.hotel.exceptions;

import org.springframework.http.HttpStatus;

public class RegraDeNegocioException extends Exception {
    private final HttpStatus status;

    public RegraDeNegocioException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public RegraDeNegocioException(String message, HttpStatus status, Object... params ) {
        super(String.format(message, params));
        this.status = status;
    }
}
