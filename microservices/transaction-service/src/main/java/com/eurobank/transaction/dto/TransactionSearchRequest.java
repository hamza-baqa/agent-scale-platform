package com.eurobank.transaction.dto;

import com.eurobank.transaction.entity.TransactionStatus;
import com.eurobank.transaction.entity.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionSearchRequest {

    private Long accountId;
    private TransactionType type;
    private TransactionStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
