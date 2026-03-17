package br.com.dbc.hotel.repository;

import br.com.dbc.hotel.entity.Quarto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QuartoRepository extends JpaRepository<Quarto, Integer> {

    Optional<Quarto>findByNome(String nome);

    Page<Quarto> findAll(Specification<Quarto> spec, Pageable pageable);

}
