package br.com.dbc.hotel.dto.custompage;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomPageDTO<T> {
    private Integer page;
    private Long totalElements;
    private Integer totalPages;
    private Integer size;
    private List<?> content;

    public CustomPageDTO(Page<T> page) {
        this.page = page.getNumber() + 1;
        this.size = page.getSize();
        this.totalPages = page.getTotalPages();
        this.totalElements = page.getTotalElements();
        this.content = page.getContent();
    }
}
