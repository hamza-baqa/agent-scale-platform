package com.eurobank.account.mapper;

import com.eurobank.account.dto.AccountRequest;
import com.eurobank.account.dto.AccountResponse;
import com.eurobank.account.dto.AccountSummaryResponse;
import com.eurobank.account.dto.BalanceResponse;
import com.eurobank.account.entity.Account;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.time.LocalDateTime;
import java.util.List;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface AccountMapper {

    AccountResponse toResponse(Account account);

    List<AccountResponse> toResponseList(List<Account> accounts);

    AccountSummaryResponse toSummaryResponse(Account account);

    List<AccountSummaryResponse> toSummaryResponseList(List<Account> accounts);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "statut", constant = "ACTIF")
    @Mapping(target = "dateOuverture", expression = "java(java.time.LocalDate.now())")
    Account toEntity(AccountRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "statut", ignore = true)
    @Mapping(target = "dateOuverture", ignore = true)
    void updateEntity(AccountRequest request, @MappingTarget Account account);

    default BalanceResponse toBalanceResponse(Account account) {
        return BalanceResponse.builder()
                .accountId(account.getId())
                .numeroCompte(account.getNumeroCompte())
                .iban(account.getIban())
                .solde(account.getSolde())
                .timestamp(LocalDateTime.now())
                .build();
    }
}
