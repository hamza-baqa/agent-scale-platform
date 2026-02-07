package com.eurobank.account.exception;

import java.math.BigDecimal;

public class InsufficientBalanceException extends RuntimeException {

    public InsufficientBalanceException(String message) {
        super(message);
    }

    public InsufficientBalanceException(BigDecimal currentBalance, BigDecimal requestedAmount) {
        super(String.format("Solde insuffisant. Solde actuel: %s, Montant demandé: %s",
                currentBalance, requestedAmount));
    }
}
