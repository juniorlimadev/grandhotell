package br.com.dbc.hotel.entity;

import br.com.dbc.hotel.enums.AlaHotel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "QUARTO")
public class Quarto {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_quarto")
    @SequenceGenerator(name = "seq_quarto", sequenceName = "seq_quarto", allocationSize = 1)
    @Column (name = "id_quarto")
    private Integer idQuarto;

    @Column(name = "nome")
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(name = "ala")
    private AlaHotel alaHotel;

    @Column(name = "valor_diaria")
    private Double valorDiaria;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "foto_url", columnDefinition = "TEXT")
    private String fotoUrl;

    @Column(name = "avaliacao")
    private Double avaliacao;

    @Column(name = "tipo")
    private String tipo;

    @Column(name = "tags")
    private String tags; 
}
