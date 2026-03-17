package br.com.dbc.hotel.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum AlaHotel {
    ALTA,
    MEDIA,
    BAIXA;

    @JsonCreator
    public static AlaHotel fromString(String value) {
        for (AlaHotel status : AlaHotel.values()) {
            if (status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Valor inválido para AlaHotel: " + value + ". Valores aceitos: ALTA, MEDIA, BAIXA.");
    }
}
