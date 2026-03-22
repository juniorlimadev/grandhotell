package br.com.dbc.hotel.entity;

import br.com.dbc.hotel.enums.StatusQuarto;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.math.BigDecimal;
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

    @Column(name = "hospede_nome")
    private String hospedeNome;

    @Column(name = "hospede_email")
    private String hospedeEmail;

    @Column(name = "observacoes")
    private String observacoes;

    @Column(name = "checkin_real")
    private LocalDateTime checkinReal;

    @Column(name = "checkout_real")
    private LocalDateTime checkoutReal;

    @Column(name = "acompanhantes")
    private String acompanhantes;

    @Column(name = "forma_pagamento")
    private String formaPagamento;

    @Column(name = "valor_deposito")
    private BigDecimal valorDeposito;

    @Column(name = "tarifa_aplicada")
    private BigDecimal tarifaAplicada;

    @Column(name = "placa_veiculo")
    private String placaVeiculo;

    @Column(name = "consumo_extra")
    private BigDecimal consumoExtra;
}
