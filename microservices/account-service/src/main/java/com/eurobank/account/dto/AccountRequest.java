package com.eurobank.account.dto;

import com.eurobank.account.entity.AccountType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountRequest {

    @NotBlank(message = "Le numéro de compte est obligatoire")
    @Size(max = 20, message = "Le numéro de compte ne peut pas dépasser 20 caractères")
    private String numeroCompte;

    @NotBlank(message = "L'IBAN est obligatoire")
    @Pattern(regexp = "^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$", message = "Format IBAN invalide")
    @Size(max = 34, message = "L'IBAN ne peut pas dépasser 34 caractères")
    private String iban;

    @NotNull(message = "Le solde initial est obligatoire")
    @DecimalMin(value = "0.0", inclusive = true, message = "Le solde ne peut pas être négatif")
    private BigDecimal solde;

    @NotNull(message = "Le type de compte est obligatoire")
    private AccountType type;

    @NotNull(message = "L'identifiant client est obligatoire")
    @Positive(message = "L'identifiant client doit être positif")
    private Long clientId;
}
