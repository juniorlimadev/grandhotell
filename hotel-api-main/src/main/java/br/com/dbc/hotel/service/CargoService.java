package br.com.dbc.hotel.service;

import br.com.dbc.hotel.entity.Cargo;
import br.com.dbc.hotel.exceptions.NotFoundException;
import br.com.dbc.hotel.repository.CargoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CargoService {
    private final CargoRepository cargoRepository;

    public Cargo findByName(String titulo) throws NotFoundException {
        Optional<Cargo> cargo = cargoRepository.findByTitulo(titulo);
        return cargo.orElseThrow(() -> new NotFoundException(titulo, "titulo"));
    }
}
