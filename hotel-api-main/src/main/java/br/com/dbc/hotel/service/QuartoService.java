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


@Service
@RequiredArgsConstructor
public class QuartoService {

    private final QuartoRepository quartoRepository;
    private final ObjectMapper objectMapper;

    public Quarto findById(Integer id) throws NotFoundException {
        return quartoRepository.findById(id).orElseThrow(() -> new NotFoundException(String.valueOf(id), "id"));
    }

    public CustomPageDTO<QuartoDTO> findAll(int page, int size, String sortField, String sortDirection){
        Sort.Direction direction = Sort.Direction.fromOptionalString(sortDirection).orElse(Sort.Direction.ASC);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortField));
        Page<Quarto> quartos = quartoRepository.findAll(pageRequest);
        return retornarCustomPageDTO(quartos);
    }

    public QuartoDTO save(QuartoCreateDTO quartoCreateDTO) throws RegraDeNegocioException {
        Quarto quarto = objectMapper.convertValue(quartoCreateDTO, Quarto.class);
        Optional<Quarto> nomeQuarto = quartoRepository.findByNome(quarto.getNome());
        if(nomeQuarto.isPresent()){
            throw new RegraDeNegocioException("Já existe quarto com esse nome", HttpStatus.BAD_REQUEST);
        }
        quarto = quartoRepository.save(quarto);
        return objectMapper.convertValue(quarto, QuartoDTO.class);

    }

    public QuartoDTO update(Integer id, QuartoCreateDTO quartoCreateDTO) throws RegraDeNegocioException {
        Optional<Quarto> nomeQuarto = quartoRepository.findByNome(quartoCreateDTO.getNome());
        if(nomeQuarto.isPresent()){
            throw new RegraDeNegocioException("Já existe quarto com esse nome", HttpStatus.BAD_REQUEST);
        }
        Quarto quarto = findById(id);
        quarto.setNome(quartoCreateDTO.getNome());
        quarto.setAlaHotel(AlaHotel.fromString(quartoCreateDTO.getAlaHotel()));

        quarto = quartoRepository.save(quarto);
        return objectMapper.convertValue(quarto, QuartoDTO.class);
    }

    public void delete(Integer id) throws NotFoundException {
        Quarto quarto = findById(id);
        quartoRepository.delete(quarto);
    }


    private CustomPageDTO<QuartoDTO> retornarCustomPageDTO(Page<Quarto> quartosPage) {
        Page<QuartoDTO> quartoDTOPage = quartosPage.map(quarto ->
                objectMapper.convertValue(quarto, QuartoDTO.class)
        );
        return new CustomPageDTO<>(quartoDTOPage);
    }

    public Page<Quarto> findAllSpec(Specification<Quarto> spec, Pageable pageable) {
        return quartoRepository.findAll(spec, pageable);
    }

}
