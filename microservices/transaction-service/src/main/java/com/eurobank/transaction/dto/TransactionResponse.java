package com.eurobank.transaction.dto;

import com.eurobank.transaction.entity.TransactionStatus;
import com.eurobank.transaction.entity.TransactionType;
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
public class TransactionResponse {

    private Long id;
    private BigDecimal montant;
    private TransactionType type;
    private LocalDateTime dateTransaction;
    private String description;
    private Long compteSourceId;
    private Long compteDestinationId;
    private TransactionStatus statut;
}
