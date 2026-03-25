package br.com.dbc.hotel.controller;

import br.com.dbc.hotel.dto.produto.ProdutoCreateDTO;
import br.com.dbc.hotel.dto.produto.ProdutoDTO;
import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import br.com.dbc.hotel.service.ProdutoService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/produto")
@Validated
@RequiredArgsConstructor
public class ProdutoController {
    private final ProdutoService produtoService;

    @Operation(summary = "Lista todos os produtos ativos")
    @GetMapping
    public ResponseEntity<List<ProdutoDTO>> list() {
        return new ResponseEntity<>(produtoService.list(), HttpStatus.OK);
    }

    @Operation(summary = "Cria um novo produto")
    @PostMapping
    public ResponseEntity<ProdutoDTO> create(@Valid @RequestBody ProdutoCreateDTO produtoCreateDTO) {
        return new ResponseEntity<>(produtoService.create(produtoCreateDTO), HttpStatus.CREATED);
    }

    @Operation(summary = "Atualiza um produto")
    @PutMapping("/{idProduto}")
    public ResponseEntity<ProdutoDTO> update(@PathVariable("idProduto") Integer id,
                                           @Valid @RequestBody ProdutoCreateDTO produtoCreateDTO) throws RegraDeNegocioException {
        return new ResponseEntity<>(produtoService.update(id, produtoCreateDTO), HttpStatus.OK);
    }

    @Operation(summary = "Remove um produto (desativa)")
    @DeleteMapping("/{idProduto}")
    public ResponseEntity<Void> delete(@PathVariable("idProduto") Integer id) throws RegraDeNegocioException {
        produtoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
