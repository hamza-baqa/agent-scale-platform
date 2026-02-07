package com.eurobank.client.repository;

import com.eurobank.client.entity.Client;
import com.eurobank.client.entity.ClientType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Client entity
 */
@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    /**
     * Find client by user ID
     */
    Optional<Client> findByUserId(Long userId);

    /**
     * Check if client exists by user ID
     */
    boolean existsByUserId(Long userId);

    /**
     * Check if client exists by email
     */
    boolean existsByEmail(String email);

    /**
     * Find clients by type
     */
    Page<Client> findByType(ClientType type, Pageable pageable);

    /**
     * Search clients by name or first name
     */
    @Query("SELECT c FROM Client c WHERE " +
           "LOWER(c.nom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.prenom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Client> searchByNomOrPrenom(@Param("query") String query, Pageable pageable);

    /**
     * Find clients by type and search query
     */
    @Query("SELECT c FROM Client c WHERE c.type = :type AND " +
           "(LOWER(c.nom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.prenom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Client> searchByTypeAndQuery(@Param("type") ClientType type,
                                      @Param("query") String query,
                                      Pageable pageable);
}
