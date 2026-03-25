package br.com.dbc.hotel.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "CONSUMO")
public class Consumo {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_consumo")
    @SequenceGenerator(name = "seq_consumo", sequenceName = "seq_consumo", allocationSize = 1)
    @Column(name = "id_consumo")
    private Integer idConsumo;

    @Column(name = "nome_produto", length = 100)
    private String nomeProduto;

    @Column(name = "preco_unitario", precision = 19, scale = 2)
    private BigDecimal precoUnitario;

    @Column(name = "quantidade")
    private Integer quantidade;

    @Column(name = "dt_consumo")
    private LocalDateTime dtConsumo;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_reserva", nullable = false)
    private Reserva reserva;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_produto", nullable = true)
    private Produto produto;
}
