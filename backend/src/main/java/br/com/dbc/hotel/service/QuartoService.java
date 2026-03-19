package br.com.dbc.hotel.service;

import br.com.dbc.hotel.dto.custompage.CustomPageDTO;
import br.com.dbc.hotel.dto.quarto.QuartoCreateDTO;
import br.com.dbc.hotel.dto.quarto.QuartoDTO;
import br.com.dbc.hotel.dto.reserva.ReservaDTO;
import br.com.dbc.hotel.entity.Quarto;
import br.com.dbc.hotel.entity.Reserva;
import br.com.dbc.hotel.enums.AlaHotel;
import br.com.dbc.hotel.exceptions.NotFoundException;
import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import br.com.dbc.hotel.repository.QuartoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Optional;


/**
 * Serviço responsável pela gestão de quartos do hotel.
 * Controla o inventário, preços e alas dos quartos.
 */
@Service
@RequiredArgsConstructor
public class QuartoService {

    private final QuartoRepository quartoRepository;
    private final ObjectMapper objectMapper;

    /**
     * Busca um quarto pelo ID.
     */
    public Quarto findById(Integer id) throws NotFoundException {
        return quartoRepository.findById(id).orElseThrow(() -> new NotFoundException(String.valueOf(id), "id"));
    }

    /**
     * Lista todos os quartos de forma paginada e ordenada.
     */
    public CustomPageDTO<QuartoDTO> findAll(int page, int size, String sortField, String sortDirection){
        Sort.Direction direction = sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortField));
        Page<Quarto> quartos = quartoRepository.findAll(pageRequest);
        return retornarCustomPageDTO(quartos);
    }

    /**
     * Cadastra um novo quarto validando a unicidade do nome.
     */
    public QuartoDTO save(QuartoCreateDTO quartoCreateDTO) throws RegraDeNegocioException {
        validarNomeUnico(quartoCreateDTO.getNome(), null);
        
        Quarto quarto = objectMapper.convertValue(quartoCreateDTO, Quarto.class);
        quarto = quartoRepository.save(quarto);
        return objectMapper.convertValue(quarto, QuartoDTO.class);
    }

    /**
     * Atualiza os dados de um quarto existente.
     */
    public QuartoDTO update(Integer id, QuartoCreateDTO quartoCreateDTO) throws RegraDeNegocioException {
        validarNomeUnico(quartoCreateDTO.getNome(), id);
        
        Quarto quarto = findById(id);
        quarto.setNome(quartoCreateDTO.getNome());
        quarto.setAlaHotel(AlaHotel.fromString(quartoCreateDTO.getAlaHotel()));
        quarto.setValorDiaria(quartoCreateDTO.getValorDiaria());
        quarto.setDescricao(quartoCreateDTO.getDescricao());
        quarto.setFotoUrl(quartoCreateDTO.getFotoUrl());
        quarto.setAvaliacao(quartoCreateDTO.getAvaliacao());
        quarto.setTipo(quartoCreateDTO.getTipo());
        quarto.setTags(quartoCreateDTO.getTags());

        quarto = quartoRepository.save(quarto);
        return objectMapper.convertValue(quarto, QuartoDTO.class);
    }

    /**
     * Remove um quarto do inventário.
     */
    public void delete(Integer id) throws NotFoundException {
        Quarto quarto = findById(id);
        quartoRepository.delete(quarto);
    }

    /**
     * Busca quartos utilizando especificações dinâmicas (filtros).
     */
    public Page<Quarto> findAllSpec(Specification<Quarto> spec, Pageable pageable) {
        return quartoRepository.findAll(spec, pageable);
    }

    // --- Métodos Privados ---

    private void validarNomeUnico(String nome, Integer idParaIgnorar) throws RegraDeNegocioException {
        Optional<Quarto> existente = quartoRepository.findByNome(nome);
        if (existente.isPresent() && !existente.get().getIdQuarto().equals(idParaIgnorar)) {
            throw new RegraDeNegocioException("Já existe um quarto com esse nome.", HttpStatus.BAD_REQUEST);
        }
    }

    private CustomPageDTO<QuartoDTO> retornarCustomPageDTO(Page<Quarto> page) {
        return new CustomPageDTO<>(page.map(q -> objectMapper.convertValue(q, QuartoDTO.class)));
    }
}

