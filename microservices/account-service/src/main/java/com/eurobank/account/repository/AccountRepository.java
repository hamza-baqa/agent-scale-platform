package com.eurobank.account.repository;

import com.eurobank.account.entity.Account;
import com.eurobank.account.entity.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    /**
     * Find all accounts belonging to a specific client
     */
    List<Account> findByClientId(Long clientId);

    /**
     * Find account by account number
     */
    Optional<Account> findByNumeroCompte(String numeroCompte);

    /**
     * Find account by IBAN
     */
    Optional<Account> findByIban(String iban);

    /**
     * Find all accounts by status
     */
    List<Account> findByStatut(AccountStatus statut);

    /**
     * Find accounts by client ID and status
     */
    List<Account> findByClientIdAndStatut(Long clientId, AccountStatus statut);

    /**
     * Check if account number exists
     */
    boolean existsByNumeroCompte(String numeroCompte);

    /**
     * Check if IBAN exists
     */
    boolean existsByIban(String iban);

    /**
     * Count accounts by client ID
     */
    long countByClientId(Long clientId);

    /**
     * Find active accounts by client ID
     */
    @Query("SELECT a FROM Account a WHERE a.clientId = :clientId AND a.statut = 'ACTIF'")
    List<Account> findActiveAccountsByClientId(@Param("clientId") Long clientId);
}
