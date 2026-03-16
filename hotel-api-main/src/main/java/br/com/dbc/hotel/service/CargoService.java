package br.com.dbc.hotel.service;

import br.com.dbc.hotel.entity.Cargo;
import br.com.dbc.hotel.repository.CargoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CargoService {
    private final CargoRepository cargoRepository;

    public Cargo findByName(String titulo) {
        return cargoRepository.findByTitulo(titulo)
                .orElseGet(() -> {
                    Cargo novo = new Cargo();
                    novo.setTitulo(titulo);
                    return cargoRepository.save(novo);
                });
    }
}
