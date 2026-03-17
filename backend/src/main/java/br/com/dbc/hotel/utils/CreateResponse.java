package br.com.dbc.hotel.utils;

import java.util.LinkedHashMap;
import java.util.Map;

public class CreateResponse {
    public static Map<String, Object> createResponseMessage(String message, Object data, String nome) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", message);
        response.put(nome, data);
        return response;
    }

    public static Map<String, Object> createResponseQuantity(int quantidade, Object data, String nome) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("Quantidade", quantidade);
        response.put(nome, data);
        return response;
    }

    public static Map<String, Object> messageResponse(String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", message);
        return response;
    }
}
