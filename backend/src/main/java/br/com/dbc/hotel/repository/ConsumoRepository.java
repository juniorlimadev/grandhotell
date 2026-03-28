package br.com.dbc.hotel.repository;

import br.com.dbc.hotel.entity.Consumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsumoRepository extends JpaRepository<Consumo, Integer> {
    List<Consumo> findAllByReserva_IdReserva(Integer idReserva);
    void deleteByReserva_IdReserva(Integer idReserva);
}
