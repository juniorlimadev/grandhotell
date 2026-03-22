package br.com.dbc.hotel.repository;

import br.com.dbc.hotel.entity.Reserva;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Integer>, JpaSpecificationExecutor<Reserva> {

    @EntityGraph(attributePaths = {"quarto", "usuario"})
    List<Reserva> findByQuarto_IdQuarto(Integer idQuarto);

    @EntityGraph(attributePaths = {"quarto", "usuario"})
    @Query("SELECT r FROM Reserva r WHERE LOWER(r.usuario.nome) LIKE LOWER(CONCAT('%', :nomeUsuario, '%'))")
    List<Reserva> findByUsuario_Nome(String nomeUsuario);

    @Override
    @EntityGraph(attributePaths = {"quarto", "usuario"})
    List<Reserva> findAll(Specification<Reserva> spec);
}

