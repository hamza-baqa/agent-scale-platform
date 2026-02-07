package com.eurobank.client.exception;

/**
 * Exception thrown when a client is not found
 */
public class ClientNotFoundException extends RuntimeException {

    public ClientNotFoundException(Long id) {
        super("Client not found with id: " + id);
    }

    public ClientNotFoundException(String message) {
        super(message);
    }
}
