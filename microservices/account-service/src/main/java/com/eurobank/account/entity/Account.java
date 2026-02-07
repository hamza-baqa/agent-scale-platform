package com.eurobank.account.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts", indexes = {
    @Index(name = "idx_numero_compte", columnList = "numeroCompte"),
    @Index(name = "idx_iban", columnList = "iban"),
    @Index(name = "idx_client_id", columnList = "clientId"),
    @Index(name = "idx_statut", columnList = "statut")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    @NotBlank(message = "Le numéro de compte est obligatoire")
    private String numeroCompte;

    @Column(nullable = false, unique = true, length = 34)
    @NotBlank(message = "L'IBAN est obligatoire")
    @Pattern(regexp = "^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$", message = "Format IBAN invalide")
    private String iban;

    @Column(nullable = false, precision = 19, scale = 2)
    @NotNull(message = "Le solde est obligatoire")
    @DecimalMin(value = "0.0", inclusive = true, message = "Le solde ne peut pas être négatif")
    private BigDecimal solde;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull(message = "Le type de compte est obligatoire")
    private AccountType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull(message = "Le statut du compte est obligatoire")
    @Builder.Default
    private AccountStatus statut = AccountStatus.ACTIF;

    @Column(nullable = false)
    @NotNull(message = "La date d'ouverture est obligatoire")
    private LocalDate dateOuverture;

    @Column(nullable = false)
    @NotNull(message = "L'identifiant client est obligatoire")
    private Long clientId;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @PrePersist
    protected void onCreate() {
        if (dateOuverture == null) {
            dateOuverture = LocalDate.now();
        }
        if (solde == null) {
            solde = BigDecimal.ZERO;
        }
        if (statut == null) {
            statut = AccountStatus.ACTIF;
        }
    }
}
