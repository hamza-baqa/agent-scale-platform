package com.eurobank.client.exception;

/**
 * Exception thrown when attempting to create a client that already exists
 */
public class ClientAlreadyExistsException extends RuntimeException {

    public ClientAlreadyExistsException(String message) {
        super(message);
    }

    public ClientAlreadyExistsException(Long userId) {
        super("Client already exists for user ID: " + userId);
    }
}
