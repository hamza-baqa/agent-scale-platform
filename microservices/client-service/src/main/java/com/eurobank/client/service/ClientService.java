package com.eurobank.client.service;

import com.eurobank.client.dto.ClientRequest;
import com.eurobank.client.dto.ClientResponse;
import com.eurobank.client.dto.ClientSummaryResponse;
import com.eurobank.client.entity.ClientType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for Client operations
 */
public interface ClientService {

    /**
     * Create a new client
     */
    ClientResponse create(ClientRequest request);

    /**
     * Update an existing client
     */
    ClientResponse update(Long id, ClientRequest request);

    /**
     * Delete a client by ID
     */
    void delete(Long id);

    /**
     * Find client by ID
     */
    ClientResponse findById(Long id);

    /**
     * Find client by user ID
     */
    ClientResponse findByUserId(Long userId);

    /**
     * Get all clients with pagination
     */
    Page<ClientSummaryResponse> getAll(Pageable pageable);

    /**
     * Search clients by query (name, first name, or email)
     */
    Page<ClientSummaryResponse> search(String query, Pageable pageable);

    /**
     * Find clients by type with pagination
     */
    Page<ClientSummaryResponse> findByType(ClientType type, Pageable pageable);

    /**
     * Search clients by type and query
     */
    Page<ClientSummaryResponse> searchByType(ClientType type, String query, Pageable pageable);
}
