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
        return consumoRepository.findAllByIdReserva(idReserva).stream()
                .map(c -> objectMapper.convertValue(c, ConsumoDTO.class))
                .collect(Collectors.toList());
    }

    public ConsumoDTO create(ConsumoCreateDTO createDTO) throws RegraDeNegocioException {
        // Valida se a reserva existe e a vincula explicitamente
        br.com.dbc.hotel.entity.Reserva reserva = reservaRepository.findById(createDTO.getIdReserva())
                .orElseThrow(() -> new RegraDeNegocioException("Reserva não encontrada", HttpStatus.NOT_FOUND));

        Consumo consumo = objectMapper.convertValue(createDTO, Consumo.class);
        consumo.setDtConsumo(LocalDateTime.now());
        consumo.setReserva(reserva);

        // Se informou um ID de produto, busca nome e preço atuais para fixar no consumo
        if (createDTO.getIdProduto() != null) {
            Produto produto = produtoRepository.findById(createDTO.getIdProduto())
                    .orElseThrow(() -> new RegraDeNegocioException("Produto não encontrado", HttpStatus.NOT_FOUND));
            
            consumo.setNomeProduto(produto.getNome());
            consumo.setPrecoUnitario(produto.getPreco());
            consumo.setProduto(produto);
        }

        return objectMapper.convertValue(consumoRepository.save(consumo), ConsumoDTO.class);
    }
}
