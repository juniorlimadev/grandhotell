package br.com.dbc.hotel.service;

import br.com.dbc.hotel.dto.custompage.CustomPageDTO;
import br.com.dbc.hotel.dto.custompage.CustomPageDateDTO;
import br.com.dbc.hotel.dto.quarto.QuartoDTO;
import br.com.dbc.hotel.dto.reserva.ReservaCreateDTO;
import br.com.dbc.hotel.dto.reserva.ReservaDTO;
import br.com.dbc.hotel.entity.Quarto;
import br.com.dbc.hotel.entity.Reserva;
import br.com.dbc.hotel.entity.Usuario;
import br.com.dbc.hotel.enums.AlaHotel;
import br.com.dbc.hotel.enums.StatusQuarto;
import br.com.dbc.hotel.exceptions.NotFoundException;
import br.com.dbc.hotel.exceptions.RegraDeNegocioException;
import br.com.dbc.hotel.repository.QuartoRepository;
import br.com.dbc.hotel.repository.ReservaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Serviço responsável pela lógica de negócio de Reservas.
 * Gerencia o ciclo de vida das estadias, conflitos de datas e disponibilidade de quartos.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReservaService {
    private final ReservaRepository reservaRepository;
    private final UsuarioService usuarioService;
    private final QuartoService quartoService;
    private final ObjectMapper objectMapper;

    /**
     * Busca uma reserva pelo ID.
     */
    public Reserva findById(Integer id) throws NotFoundException {
        return reservaRepository.findById(id).orElseThrow(() -> new NotFoundException(String.valueOf(id), "id"));
    }

    /**
     * Lista todas as reservas de um quarto específico.
     */
    public List<Reserva> buscarReservasPorQuarto(Integer idQuarto) {
        return reservaRepository.findByQuarto_IdQuarto(idQuarto);
    }

    /**
     * Busca reservas associadas ao nome de um usuário (responsável).
     */
    @Transactional(readOnly = true)
    public List<ReservaDTO> buscarReservasPorNomeUsuario(String nomeUsuario) {
        List<Reserva> reservas = reservaRepository.findByUsuario_Nome(nomeUsuario);
        return reservas.stream()
                .map(this::entidadeParaDTO)
                .collect(Collectors.toList());
    }

    /**
     * Cria uma nova reserva validando conflitos de agenda.
     */
    public ReservaDTO save(ReservaCreateDTO reservaCreateDTO) throws RegraDeNegocioException {
        validarDatas(reservaCreateDTO.getDtInicio(), reservaCreateDTO.getDtFim());
        
        Usuario usuario = reservaCreateDTO.getIdUsuario() != null ? usuarioService.findById(reservaCreateDTO.getIdUsuario()) : null;
        Quarto quarto = quartoService.findById(reservaCreateDTO.getIdQuarto());
        
        validarConflitos(quarto.getIdQuarto(), reservaCreateDTO.getDtInicio(), reservaCreateDTO.getDtFim(), null);

        Reserva reserva = objectMapper.convertValue(reservaCreateDTO, Reserva.class);
        reserva.setUsuario(usuario);
        reserva.setQuarto(quarto);
        reserva.setStatusQuarto(StatusQuarto.OCUPADO);
        
        Reserva reservaSalva = reservaRepository.save(reserva);
        return entidadeParaDTO(reservaSalva);
    }

    /**
     * Remove uma reserva do sistema.
     */
    public void deletarReserva(Integer idReserva) throws RegraDeNegocioException {
        Reserva byId = findById(idReserva);
        reservaRepository.delete(byId);
    }

    /**
     * Atualiza os dados de uma reserva existente.
     */
    public ReservaDTO update(Integer idReserva, ReservaCreateDTO reservaCreateDTO) throws RegraDeNegocioException {
        Reserva reserva = findById(idReserva);
        validarDatas(reservaCreateDTO.getDtInicio(), reservaCreateDTO.getDtFim());

        Usuario usuario = reservaCreateDTO.getIdUsuario() != null ? usuarioService.findById(reservaCreateDTO.getIdUsuario()) : null;
        Quarto quarto = quartoService.findById(reservaCreateDTO.getIdQuarto());

        validarConflitos(quarto.getIdQuarto(), reservaCreateDTO.getDtInicio(), reservaCreateDTO.getDtFim(), idReserva);

        reserva.setUsuario(usuario);
        reserva.setQuarto(quarto);
        reserva.setDtInicio(reservaCreateDTO.getDtInicio());
        reserva.setDtFim(reservaCreateDTO.getDtFim());
        reserva.setHospedeNome(reservaCreateDTO.getHospedeNome());
        reserva.setHospedeEmail(reservaCreateDTO.getHospedeEmail());
        reserva.setObservacoes(reservaCreateDTO.getObservacoes());
        
        if (reservaCreateDTO.getStatusQuarto() != null) {
            reserva.setStatusQuarto(StatusQuarto.fromString(reservaCreateDTO.getStatusQuarto()));
        }

        Reserva reservaSalva = reservaRepository.save(reserva);
        return entidadeParaDTO(reservaSalva);
    }

    /**
     * Busca quartos que não possuem reservas no intervalo de datas e ala especificados.
     */
    public CustomPageDateDTO<QuartoDTO> buscarQuartosLivresPorAlaEData(Integer page, Integer size, String sortField, String sortDirection, String ala, LocalDate dtInicio, LocalDate dtFim) throws RegraDeNegocioException {
        validarDatas(dtInicio, dtFim);

        Specification<Quarto> spec = Specification.where((root, query, criteriaBuilder) -> {
            if (ala != null && !ala.isEmpty()) {
                AlaHotel alaHotel = AlaHotel.fromString(ala);
                return criteriaBuilder.equal(root.get("alaHotel"), alaHotel);
            }
            return criteriaBuilder.conjunction();
        });

        // Identifica quartos ocupados no período
        List<ReservaDTO> reservasNoPeriodo = buscarReservasPorIntervalo(dtInicio, dtFim);
        List<Integer> idsOcupados = reservasNoPeriodo.stream()
                .map(ReservaDTO::getIdQuarto)
                .collect(Collectors.toList());

        if (!idsOcupados.isEmpty()) {
            spec = spec.and((root, query, criteriaBuilder) -> criteriaBuilder.not(root.get("idQuarto").in(idsOcupados)));
        }

        Sort sort = Sort.by(sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, sortField);
        Page<Quarto> quartosPage = quartoService.findAllSpec(spec, PageRequest.of(page, size, sort));

        List<QuartoDTO> dtos = quartosPage.stream()
                .map(q -> objectMapper.convertValue(q, QuartoDTO.class))
                .collect(Collectors.toList());

        return new CustomPageDateDTO<>(quartosPage.getTotalPages(), quartosPage.getTotalElements(), quartosPage.getNumber(), quartosPage.getSize(), dtos, dtInicio, dtFim);
    }

    /**
     * Retorna todas as reservas que ocorrem dentro do intervalo solicitado.
     */
    @Transactional(readOnly = true)
    public List<ReservaDTO> buscarReservasPorIntervalo(LocalDate dtInicio, LocalDate dtFim) throws RegraDeNegocioException {
        validarDatas(dtInicio, dtFim);

        Specification<Reserva> spec = (root, query, criteriaBuilder) -> criteriaBuilder.and(
                criteriaBuilder.lessThanOrEqualTo(root.get("dtInicio"), dtFim),
                criteriaBuilder.greaterThanOrEqualTo(root.get("dtFim"), dtInicio)
        );

        return reservaRepository.findAll(spec).stream()
                .map(this::entidadeParaDTO)
                .collect(Collectors.toList());
    }

    // --- Métodos Privados Auxiliares ---

    private void validarDatas(LocalDate dtInicio, LocalDate dtFim) throws RegraDeNegocioException {
        if (dtInicio.isAfter(dtFim)) {
            throw new RegraDeNegocioException("Data de início não pode ser após a data de fim.", HttpStatus.BAD_REQUEST);
        }
    }

    private void validarConflitos(Integer idQuarto, LocalDate dtInicio, LocalDate dtFim, Integer idReservaIgnorar) throws RegraDeNegocioException {
        List<Reserva> reservas = buscarReservasPorQuarto(idQuarto);
        for (Reserva r : reservas) {
            if (idReservaIgnorar != null && r.getIdReserva().equals(idReservaIgnorar)) continue;
            
            if (dtInicio.isBefore(r.getDtFim()) && dtFim.isAfter(r.getDtInicio())) {
                throw new RegraDeNegocioException("O quarto já está reservado neste período.", HttpStatus.BAD_REQUEST);
            }
        }
    }

    private ReservaDTO entidadeParaDTO(Reserva reserva) {
        ReservaDTO dto = objectMapper.convertValue(reserva, ReservaDTO.class);
        if (reserva.getQuarto() != null) {
            dto.setIdQuarto(reserva.getQuarto().getIdQuarto());
            dto.setQuartoNome(reserva.getQuarto().getNome());
            dto.setValorDiaria(reserva.getQuarto().getValorDiaria());
        }
        if (reserva.getUsuario() != null) dto.setIdUsuario(reserva.getUsuario().getIdUsuario());
        return dto;
    }
}

