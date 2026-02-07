package com.eurobank.account.dto;

import com.eurobank.account.entity.AccountStatus;
import com.eurobank.account.entity.AccountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountResponse {

    private Long id;
    private String numeroCompte;
    private String iban;
    private BigDecimal solde;
    private AccountType type;
    private AccountStatus statut;
    private LocalDate dateOuverture;
    private Long clientId;
    private LocalDateTime createdDate;
}
