package br.com.dbc.hotel.repository;

import br.com.dbc.hotel.entity.Reserva;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Integer > {

    List<Reserva> findByQuarto_IdQuarto(Integer idQuarto);

    @Query("SELECT r FROM Reserva r WHERE LOWER(r.usuario.nome) LIKE LOWER(CONCAT('%', :nomeUsuario, '%'))")
    List<Reserva> findByUsuario_Nome(String nomeUsuario);

    List<Reserva> findAll(Specification<Reserva> spec);
}
