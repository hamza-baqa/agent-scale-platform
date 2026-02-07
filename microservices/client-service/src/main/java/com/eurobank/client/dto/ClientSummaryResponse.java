package com.eurobank.client.dto;

import com.eurobank.client.entity.ClientType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for client summary response (lightweight version)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientSummaryResponse {

    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private ClientType type;
    private Long userId;
}
