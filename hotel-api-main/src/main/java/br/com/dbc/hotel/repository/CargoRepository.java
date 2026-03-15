package br.com.dbc.hotel.repository;

import br.com.dbc.hotel.entity.Cargo;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

public interface CargoRepository extends CrudRepository<Cargo, Integer> {
    Optional<Cargo> findByTitulo(String titulo);
}
