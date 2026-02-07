package com.eurobank.client.mapper;

import com.eurobank.client.dto.AddressDto;
import com.eurobank.client.dto.ClientRequest;
import com.eurobank.client.dto.ClientResponse;
import com.eurobank.client.dto.ClientSummaryResponse;
import com.eurobank.client.entity.Address;
import com.eurobank.client.entity.Client;
import org.mapstruct.*;

/**
 * MapStruct mapper for Client entity and DTOs
 */
@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ClientMapper {

    /**
     * Convert Client entity to ClientResponse DTO
     */
    ClientResponse toResponse(Client client);

    /**
     * Convert Client entity to ClientSummaryResponse DTO
     */
    ClientSummaryResponse toSummaryResponse(Client client);

    /**
     * Convert ClientRequest DTO to Client entity
     */
    Client toEntity(ClientRequest request);

    /**
     * Update Client entity from ClientRequest DTO
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "lastModifiedDate", ignore = true)
    void updateEntityFromRequest(ClientRequest request, @MappingTarget Client client);

    /**
     * Convert Address to AddressDto
     */
    AddressDto toAddressDto(Address address);

    /**
     * Convert AddressDto to Address
     */
    Address toAddress(AddressDto addressDto);
}
