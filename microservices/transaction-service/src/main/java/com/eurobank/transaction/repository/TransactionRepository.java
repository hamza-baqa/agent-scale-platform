package com.eurobank.transaction.repository;

import com.eurobank.transaction.entity.Transaction;
import com.eurobank.transaction.entity.TransactionStatus;
import com.eurobank.transaction.entity.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByCompteSourceId(Long compteSourceId);

    List<Transaction> findByCompteDestinationId(Long compteDestinationId);

    List<Transaction> findByDateTransactionBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT t FROM Transaction t WHERE t.compteSourceId = :accountId OR t.compteDestinationId = :accountId ORDER BY t.dateTransaction DESC")
    List<Transaction> findByAccountId(@Param("accountId") Long accountId);

    @Query("SELECT t FROM Transaction t WHERE (t.compteSourceId = :accountId OR t.compteDestinationId = :accountId) " +
           "AND t.dateTransaction BETWEEN :startDate AND :endDate ORDER BY t.dateTransaction DESC")
    List<Transaction> findByAccountIdAndDateBetween(@Param("accountId") Long accountId,
                                                     @Param("startDate") LocalDateTime startDate,
                                                     @Param("endDate") LocalDateTime endDate);

    @Query("SELECT t FROM Transaction t WHERE (t.compteSourceId = :accountId OR t.compteDestinationId = :accountId) " +
           "AND t.type = :type ORDER BY t.dateTransaction DESC")
    List<Transaction> findByAccountIdAndType(@Param("accountId") Long accountId,
                                              @Param("type") TransactionType type);

    @Query("SELECT t FROM Transaction t WHERE (t.compteSourceId = :accountId OR t.compteDestinationId = :accountId) " +
           "AND t.statut = :status ORDER BY t.dateTransaction DESC")
    List<Transaction> findByAccountIdAndStatus(@Param("accountId") Long accountId,
                                                @Param("status") TransactionStatus status);

    List<Transaction> findByCompteSourceIdOrderByDateTransactionDesc(Long compteSourceId);

    List<Transaction> findByCompteDestinationIdOrderByDateTransactionDesc(Long compteDestinationId);
}
