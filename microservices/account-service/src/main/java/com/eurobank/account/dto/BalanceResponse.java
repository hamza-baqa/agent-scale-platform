package com.eurobank.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BalanceResponse {

    private Long accountId;
    private String numeroCompte;
    private String iban;
    private BigDecimal solde;
    private LocalDateTime timestamp;
}
