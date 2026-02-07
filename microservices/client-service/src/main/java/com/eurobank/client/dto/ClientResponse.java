package com.eurobank.client.dto;

import com.eurobank.client.entity.ClientType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for client response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientResponse {

    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private LocalDate dateNaissance;
    private ClientType type;
    private Long userId;
    private AddressDto address;
    private LocalDateTime createdDate;
    private LocalDateTime lastModifiedDate;
}
