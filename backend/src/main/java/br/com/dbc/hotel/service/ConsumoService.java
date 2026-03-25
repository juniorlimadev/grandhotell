package br.com.dbc.hotel.service;

import br.com.dbc.hotel.dto.consumo.ConsumoCreateDTO;
import br.com.dbc.hotel.dto.consumo.ConsumoDTO;
import br.com.dbc.hotel.entity.Consumo;
import br.com.dbc.hotel.entity.Produto;
import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import br.com.dbc.hotel.repository.ConsumoRepository;
import br.com.dbc.hotel.repository.ProdutoRepository;
import br.com.dbc.hotel.repository.ReservaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConsumoService {
    private final ConsumoRepository consumoRepository;
    private final ProdutoRepository produtoRepository;
    private final ReservaRepository reservaRepository;
    private final ObjectMapper objectMapper;

    public List<ConsumoDTO> listByReserva(Integer idReserva) {
        return consumoRepository.findAllByReserva_IdReserva(idReserva).stream()
                .map(c -> {
                    ConsumoDTO dto = new ConsumoDTO();
                    dto.setIdConsumo(c.getIdConsumo());
                    dto.setIdReserva(c.getReserva().getIdReserva());
                    dto.setIdProduto(c.getProduto() != null ? c.getProduto().getIdProduto() : null);
                    dto.setNomeProduto(c.getNomeProduto());
                    dto.setPrecoUnitario(c.getPrecoUnitario());
                    dto.setQuantidade(c.getQuantidade());
                    dto.setDtConsumo(c.getDtConsumo());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public ConsumoDTO create(ConsumoCreateDTO createDTO) throws RegraDeNegocioException {
        System.out.println("[GRANDHOTEL-CONSUMO] Criando consumo para reserva: " + createDTO.getIdReserva());
        
        br.com.dbc.hotel.entity.Reserva reserva = reservaRepository.findById(createDTO.getIdReserva())
                .orElseThrow(() -> new RegraDeNegocioException("Reserva não encontrada", HttpStatus.NOT_FOUND));

        Consumo consumo = new Consumo();
        consumo.setReserva(reserva);
        consumo.setQuantidade(createDTO.getQuantidade());
        consumo.setDtConsumo(LocalDateTime.now());

        if (createDTO.getIdProduto() != null) {
            System.out.println("[GRANDHOTEL-CONSUMO] Buscando produto: " + createDTO.getIdProduto());
            Produto produto = produtoRepository.findById(createDTO.getIdProduto())
                    .orElseThrow(() -> new RegraDeNegocioException("Produto não encontrado", HttpStatus.NOT_FOUND));
            
            consumo.setProduto(produto);
            consumo.setNomeProduto(produto.getNome());
            consumo.setPrecoUnitario(produto.getPreco());
        } else {
            // Caso seja um item manual (não cadastrado no catálogo)
            consumo.setNomeProduto(createDTO.getNomeProduto());
            consumo.setPrecoUnitario(createDTO.getPrecoUnitario());
        }

        try {
            Consumo salvo = consumoRepository.save(consumo);
            System.out.println("[GRANDHOTEL-CONSUMO] Consumo salvo com sucesso: " + salvo.getIdConsumo());
            
            ConsumoDTO dto = new ConsumoDTO();
            dto.setIdConsumo(salvo.getIdConsumo());
            dto.setIdReserva(reserva.getIdReserva());
            dto.setIdProduto(salvo.getProduto() != null ? salvo.getProduto().getIdProduto() : null);
            dto.setNomeProduto(salvo.getNomeProduto());
            dto.setPrecoUnitario(salvo.getPrecoUnitario());
            dto.setQuantidade(salvo.getQuantidade());
            dto.setDtConsumo(salvo.getDtConsumo());
            return dto;
        } catch (Exception e) {
            System.err.println("[GRANDHOTEL-CONSUMO] Erro fatal ao salvar: " + e.getMessage());
            e.printStackTrace();
            throw new RegraDeNegocioException("Erro ao persistir consumo. Verifique se todos os campos obrigatórios estão presentes.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
