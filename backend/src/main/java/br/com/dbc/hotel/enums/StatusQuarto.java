package br.com.dbc.hotel.enums;

import com.fasterxml.jackson.annotation.JsonCreator;


public enum StatusQuarto {
    DISPONIVEL,
    OCUPADO;


    @JsonCreator
    public static StatusQuarto fromString(String value) {
        for (StatusQuarto status : StatusQuarto.values()) {
            if (status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Valor inválido para StatusQuarto: " + value + ". Valores aceitos: DISPONIVEL, OCUPADO");
    }
}
