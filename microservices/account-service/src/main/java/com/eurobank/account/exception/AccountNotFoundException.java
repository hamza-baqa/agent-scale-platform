package com.eurobank.account.exception;

public class AccountNotFoundException extends RuntimeException {

    public AccountNotFoundException(String message) {
        super(message);
    }

    public AccountNotFoundException(Long id) {
        super("Compte non trouvé avec l'ID: " + id);
    }

    public AccountNotFoundException(String field, String value) {
        super(String.format("Compte non trouvé avec %s: %s", field, value));
    }
}
