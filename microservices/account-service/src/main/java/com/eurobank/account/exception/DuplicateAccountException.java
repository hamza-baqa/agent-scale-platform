package com.eurobank.account.exception;

public class DuplicateAccountException extends RuntimeException {

    public DuplicateAccountException(String message) {
        super(message);
    }

    public DuplicateAccountException(String field, String value) {
        super(String.format("Un compte existe déjà avec %s: %s", field, value));
    }
}
