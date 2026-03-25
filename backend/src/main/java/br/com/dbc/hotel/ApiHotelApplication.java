package br.com.dbc.hotel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiHotelApplication {

	public static void main(String[] args) {
		System.out.println(">>> [GRANDHOTEL-DIAG] INICIANDO JVM - AGUARDANDO SPRING BOOT...");
		SpringApplication.run(ApiHotelApplication.class, args);
	}

}
