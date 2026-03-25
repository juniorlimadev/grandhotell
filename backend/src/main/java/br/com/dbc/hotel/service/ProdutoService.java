package br.com.dbc.hotel.service;

import br.com.dbc.hotel.dto.produto.ProdutoCreateDTO;
import br.com.dbc.hotel.dto.produto.ProdutoDTO;
import br.com.dbc.hotel.entity.Produto;
import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import br.com.dbc.hotel.repository.ProdutoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProdutoService {
    private final ProdutoRepository produtoRepository;
    private final ObjectMapper objectMapper;

    public List<ProdutoDTO> list() {
        return produtoRepository.findAllByAtivoIsTrue().stream()
                .map(p -> objectMapper.convertValue(p, ProdutoDTO.class))
                .collect(Collectors.toList());
    }

    public ProdutoDTO create(ProdutoCreateDTO produtoCreateDTO) {
        Produto produto = objectMapper.convertValue(produtoCreateDTO, Produto.class);
        produto.setAtivo(true);
        return objectMapper.convertValue(produtoRepository.save(produto), ProdutoDTO.class);
    }

    public ProdutoDTO update(Integer id, ProdutoCreateDTO produtoCreateDTO) throws RegraDeNegocioException {
        Produto produto = findById(id);
        produto.setNome(produtoCreateDTO.getNome());
        produto.setPreco(produtoCreateDTO.getPreco());
        produto.setCategoria(produtoCreateDTO.getCategoria());
        produto.setIcone(produtoCreateDTO.getIcone());
        return objectMapper.convertValue(produtoRepository.save(produto), ProdutoDTO.class);
    }

    public void delete(Integer id) throws RegraDeNegocioException {
        Produto produto = findById(id);
        produto.setAtivo(false);
        produtoRepository.save(produto);
    }

    protected Produto findById(Integer id) throws RegraDeNegocioException {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new RegraDeNegocioException("Produto não encontrado", HttpStatus.NOT_FOUND));
    }
}
