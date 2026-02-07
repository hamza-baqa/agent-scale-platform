package com.eurobank.account.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateBalanceRequest {

    @NotNull(message = "Le montant est obligatoire")
    private BigDecimal montant;

    @NotNull(message = "Le type d'opération est obligatoire")
    private OperationType operation;

    public enum OperationType {
        CREDIT,
        DEBIT
    }
}
