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

    @Column(name = "id_reserva", insertable = false, updatable = false)
    private Integer idReserva;

    @Column(name = "id_produto", insertable = false, updatable = false)
    private Integer idProduto;

    @Column(name = "nome_produto")
    private String nomeProduto;

    @Column(name = "preco_unitario")
    private BigDecimal precoUnitario;

    @Column(name = "quantidade")
    private Integer quantidade;

    @Column(name = "dt_consumo")
    private LocalDateTime dtConsumo;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_reserva", referencedColumnName = "id_reserva")
    private Reserva reserva;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_produto", referencedColumnName = "id_produto")
    private Produto produto;
}
