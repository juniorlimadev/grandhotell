package br.com.dbc.hotel.repository;

import br.com.dbc.hotel.entity.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Integer> {
    List<Produto> findAllByAtivoIsTrue();
}
