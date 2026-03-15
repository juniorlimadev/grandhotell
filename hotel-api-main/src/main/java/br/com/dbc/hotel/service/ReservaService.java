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
import liquibase.pro.packaged.S;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservaService {
    private final ReservaRepository reservaRepository;
    private final UsuarioService usuarioService;
    private final QuartoService quartoService;
    private final ObjectMapper objectMapper;

    public Reserva findById(Integer id) throws NotFoundException {
        excluirReservasComDataFinalAposDataAtualSemHora();
        return reservaRepository.findById(id).orElseThrow(() -> new NotFoundException(String.valueOf(id), "id"));
    }

    public List<Reserva> buscarReservasPorQuarto(Integer idQuarto) {
        excluirReservasComDataFinalAposDataAtualSemHora();
        return reservaRepository.findByQuarto_IdQuarto(idQuarto);
    }

    public List<ReservaDTO> buscarReservasPorNomeUsuario(String nomeUsuario) {
        excluirReservasComDataFinalAposDataAtualSemHora();
        List<Reserva> reservas = reservaRepository.findByUsuario_Nome(nomeUsuario);
        return reservas.stream()
                .map(reserva -> {
                    ReservaDTO reservaDTO = objectMapper.convertValue(reserva, ReservaDTO.class);
                    try {
                        atualizarReservaColunasExternas(reserva, reservaDTO);
                    } catch (RegraDeNegocioException e) {
                        throw new RuntimeException(e);
                    }
                    return reservaDTO;
                })
                .collect(Collectors.toList());
    }

    public ReservaDTO save(ReservaCreateDTO reservaCreateDTO) throws RegraDeNegocioException {
        if (reservaCreateDTO.getDtInicio().isAfter(reservaCreateDTO.getDtFim())) {
            throw new RegraDeNegocioException("A data de início não pode ser após a data de fim.", HttpStatus.BAD_REQUEST);
        }
        Usuario usuario = usuarioService.findById(reservaCreateDTO.getIdUsuario());
        Quarto quarto = quartoService.findById(reservaCreateDTO.getIdQuarto());
        List<Reserva> reservas = buscarReservasPorQuarto(quarto.getIdQuarto());

        LocalDate dtInicio = reservaCreateDTO.getDtInicio();
        LocalDate dtFim = reservaCreateDTO.getDtFim();

        if (!reservas.isEmpty()) {
            for (Reserva reserva : reservas) {
                LocalDate reservaDtInicio = reserva.getDtInicio();
                LocalDate reservaDtFim = reserva.getDtFim();
                if ((dtInicio.isBefore(reservaDtFim) && dtFim.isAfter(reservaDtInicio)) ||
                        (dtInicio.isEqual(reservaDtInicio) || dtInicio.isAfter(reservaDtInicio)) &&
                                (dtFim.isBefore(reservaDtFim) || dtFim.isEqual(reservaDtFim))) {
                    throw new RegraDeNegocioException("A reserva conflita com outra reserva existente.", HttpStatus.BAD_REQUEST);
                }
            }
        }

        Reserva reserva = objectMapper.convertValue(reservaCreateDTO, Reserva.class);
        reserva.setUsuario(usuario);
        reserva.setQuarto(quarto);
        reserva.setStatusQuarto(StatusQuarto.OCUPADO);
        Reserva reservaSalva = reservaRepository.save(reserva);
        ReservaDTO reservaDTO = objectMapper.convertValue(reservaSalva, ReservaDTO.class);
        atualizarReservaColunasExternas(reservaSalva, reservaDTO);
        return reservaDTO;
    }

    public void deletarReserva(Integer idReserva) throws RegraDeNegocioException {
        Reserva byId = findById(idReserva);
        reservaRepository.delete(byId);
    }

    public CustomPageDateDTO<QuartoDTO> buscarQuartosLivresPorAlaEData(Integer page,
                                                                           Integer size,
                                                                           String sortField,
                                                                           String sortDirection,
                                                                           String ala,
                                                                           LocalDate dtInicio,
                                                                           LocalDate dtFim) throws RegraDeNegocioException {

        Specification<Quarto> spec = Specification.where((root, query, criteriaBuilder) -> {
            if (ala != null && !ala.isEmpty()) {
                try {
                    AlaHotel alaHotel = AlaHotel.fromString(ala);
                    log.info("Filtro aplicado para a ala: {}", alaHotel);
                    return criteriaBuilder.equal(root.get("alaHotel"), alaHotel);
                } catch (IllegalArgumentException e) {
                    log.error("Erro ao tentar converter a ala: {}", ala);
                    try {
                        throw new RegraDeNegocioException("Ala inválida fornecida.", HttpStatus.BAD_REQUEST);
                    } catch (RegraDeNegocioException ex) {
                        throw new RuntimeException(ex);
                    }
                }
            }
            return criteriaBuilder.conjunction();
        });

        List<ReservaDTO> reservaDTOS = buscarReservasPorIntervalo(dtInicio, dtFim);
        log.info("Reservas encontradas no intervalo de datas: {}", reservaDTOS);

        List<Integer> quartosOcupados = reservaDTOS.stream()
                .map(ReservaDTO::getIdQuarto)
                .collect(Collectors.toList());
        log.info("IDs dos quartos ocupados: {}", quartosOcupados);

        if (!quartosOcupados.isEmpty()) {
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.not(root.get("idQuarto").in(quartosOcupados)));
        }

        Sort sort = Sort.by(sortDirection.equals("desc") ? Sort.Order.desc(sortField) : Sort.Order.asc(sortField));
        log.info("Ordenação aplicada: {} {}", sortField, sortDirection);

        PageRequest pageRequest = PageRequest.of(page, size, sort);
        Page<Quarto> quartosPage;

        try {
            quartosPage = quartoService.findAllSpec(spec, pageRequest);
            log.info("Quartos encontrados: {}", quartosPage.getContent());
        } catch (Exception e) {
            log.error("Erro ao buscar quartos: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar quartos livres", e);
        }

        List<QuartoDTO> quartoDTOs = quartosPage.stream()
                .map(quarto -> objectMapper.convertValue(quarto, QuartoDTO.class))
                .collect(Collectors.toList());

        return new CustomPageDateDTO<>(
                quartosPage.getTotalPages(),
                quartosPage.getTotalElements(),
                quartosPage.getPageable().getPageNumber(),
                quartosPage.getSize(),
                quartoDTOs,
                dtInicio,
                dtFim
        );
    }



    public List<ReservaDTO> buscarReservasPorIntervalo(LocalDate dtInicio, LocalDate dtFim) throws RegraDeNegocioException {
        if (dtInicio.isAfter(dtFim)) {
            throw new RegraDeNegocioException("A data de início não pode ser após a data de fim.", HttpStatus.BAD_REQUEST);
        }

        Specification<Reserva> spec = (root, query, criteriaBuilder) -> criteriaBuilder.or(
                criteriaBuilder.and(
                        criteriaBuilder.lessThanOrEqualTo(root.get("dtInicio"), dtFim),
                        criteriaBuilder.greaterThanOrEqualTo(root.get("dtFim"), dtInicio)
                )
        );

        List<Reserva> reservas = reservaRepository.findAll(spec);

        if (reservas.isEmpty()) {
            return new ArrayList<>();
        } else {
            return reservas.stream()
                    .map(reserva -> {
                        ReservaDTO reservaDTO = objectMapper.convertValue(reserva, ReservaDTO.class);
                        try {
                            atualizarReservaColunasExternas(reserva, reservaDTO);
                        } catch (RegraDeNegocioException e) {
                            e.printStackTrace();
                        }
                        return reservaDTO;
                    })
                    .collect(Collectors.toList());
        }
    }

    private void excluirReservasComDataFinalAposDataAtualSemHora() {
        LocalDate dataAtual = LocalDate.now();
        List<Reserva> reservas = reservaRepository.findAll();
        for (Reserva reserva : reservas) {
            if (reserva.getDtFim().isBefore(dataAtual)) {
                reservaRepository.delete(reserva);
            }
        }
    }

    private void atualizarReservaColunasExternas(Reserva reserva, ReservaDTO reservaDTO) throws RegraDeNegocioException {
        if (reserva.getQuarto() != null) {
            reservaDTO.setIdQuarto(reserva.getQuarto().getIdQuarto());
        }

        if (reserva.getUsuario() != null) {
            reservaDTO.setIdUsuario(reserva.getUsuario().getIdUsuario());
        }
    }
}
