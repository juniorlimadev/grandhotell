package br.com.dbc.hotel.entity;

import br.com.dbc.hotel.enums.StatusQuarto;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "RESERVA")
public class Reserva {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_reserva")
    @SequenceGenerator(name = "seq_reserva", sequenceName = "seq_reserva", allocationSize = 1)
    @Column (name = "id_reserva")
    private Integer idReserva;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", referencedColumnName = "id_usuario")
    private Usuario usuario;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_quarto", referencedColumnName = "id_quarto")
    private Quarto quarto;

    @Column(name = "dt_inicio")
    private LocalDate dtInicio;

    @Column(name = "dt_fim")
    private LocalDate dtFim;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StatusQuarto statusQuarto;
}
