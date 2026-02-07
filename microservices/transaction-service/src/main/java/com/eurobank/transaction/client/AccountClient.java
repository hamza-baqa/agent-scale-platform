package com.eurobank.transaction.client;

import com.eurobank.transaction.dto.AccountUpdateRequest;
import com.eurobank.transaction.exception.InvalidTransactionException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class AccountClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.account-service.url:http://localhost:8083}")
    private String accountServiceUrl;

    public void updateAccountBalance(Long accountId, BigDecimal amount, String operation) {
        log.info("Updating account {} balance: {} {}", accountId, operation, amount);

        AccountUpdateRequest request = AccountUpdateRequest.builder()
                .accountId(accountId)
                .amount(amount)
                .operation(operation)
                .build();

        try {
            webClientBuilder.build()
                    .post()
                    .uri(accountServiceUrl + "/api/v1/accounts/{id}/balance", accountId)
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(),
                            response -> response.bodyToMono(String.class)
                                    .flatMap(body -> Mono.error(new InvalidTransactionException(
                                            "Erreur lors de la mise à jour du solde: " + body))))
                    .onStatus(status -> status.is5xxServerError(),
                            response -> Mono.error(new RuntimeException(
                                    "Service de compte indisponible")))
                    .bodyToMono(Void.class)
                    .block();

            log.info("Account {} balance updated successfully", accountId);
        } catch (Exception e) {
            log.error("Failed to update account balance: {}", e.getMessage());
            throw new InvalidTransactionException("Échec de la mise à jour du solde du compte: " + e.getMessage());
        }
    }

    public void creditAccount(Long accountId, BigDecimal amount) {
        updateAccountBalance(accountId, amount, "CREDIT");
    }

    public void debitAccount(Long accountId, BigDecimal amount) {
        updateAccountBalance(accountId, amount, "DEBIT");
    }

    public boolean verifyAccountExists(Long accountId) {
        log.info("Verifying if account {} exists", accountId);

        try {
            Boolean exists = webClientBuilder.build()
                    .get()
                    .uri(accountServiceUrl + "/api/v1/accounts/{id}/exists", accountId)
                    .retrieve()
                    .bodyToMono(Boolean.class)
                    .block();

            return exists != null && exists;
        } catch (Exception e) {
            log.error("Failed to verify account existence: {}", e.getMessage());
            return false;
        }
    }
}
