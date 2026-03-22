package br.com.dbc.hotel.repository;

import br.com.dbc.hotel.entity.Reserva;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Integer>, JpaSpecificationExecutor<Reserva> {

    @EntityGraph(attributePaths = {"quarto", "usuario"})
    List<Reserva> findByQuarto_IdQuarto(Integer idQuarto);

    @EntityGraph(attributePaths = {"quarto", "usuario"})
    @Query("SELECT r FROM Reserva r WHERE LOWER(r.usuario.nome) LIKE LOWER(CONCAT('%', :nomeUsuario, '%'))")
    List<Reserva> findByUsuario_Nome(@Param("nomeUsuario") String nomeUsuario);

    @EntityGraph(attributePaths = {"quarto", "usuario"})
    @Query("SELECT r FROM Reserva r WHERE r.dtInicio <= :dtFim AND r.dtFim >= :dtInicio")
    List<Reserva> buscarReservasNoIntervalo(@Param("dtInicio") java.time.LocalDate dtInicio, 
                                            @Param("dtFim") java.time.LocalDate dtFim);
}

