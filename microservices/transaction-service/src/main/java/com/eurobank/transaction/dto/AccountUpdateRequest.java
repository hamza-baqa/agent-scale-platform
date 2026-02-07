package com.eurobank.transaction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountUpdateRequest {

    private Long accountId;
    private BigDecimal amount;
    private String operation; // "CREDIT" or "DEBIT"
}
