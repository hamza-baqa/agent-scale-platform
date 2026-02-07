package com.eurobank.transaction.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private BigDecimal montant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    private LocalDateTime dateTransaction;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Long compteSourceId;

    @Column
    private Long compteDestinationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus statut;

    @PrePersist
    protected void onCreate() {
        if (dateTransaction == null) {
            dateTransaction = LocalDateTime.now();
        }
        if (statut == null) {
            statut = TransactionStatus.EN_ATTENTE;
        }
    }
}
