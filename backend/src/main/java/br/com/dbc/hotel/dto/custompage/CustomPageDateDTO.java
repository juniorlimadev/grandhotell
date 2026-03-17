package br.com.dbc.hotel.dto.custompage;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomPageDateDTO<T> {
    private Integer page;
    private Long totalElements;
    private Integer totalPages;
    private Integer size;
    private List<?> content;
    private LocalDate dtInicio;
    private LocalDate dtFim;

    public CustomPageDateDTO(Page<T> page, LocalDate dtInicio, LocalDate dtFim) {
        this.page = page.getNumber() + 1;
        this.size = page.getSize();
        this.totalPages = page.getTotalPages();
        this.totalElements = page.getTotalElements();
        this.content = page.getContent();
        this.dtInicio = dtInicio;
        this.dtFim = dtFim;
    }
}
