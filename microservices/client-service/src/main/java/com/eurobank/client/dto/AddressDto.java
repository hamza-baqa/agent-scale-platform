package com.eurobank.client.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Address
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {

    @NotBlank(message = "Street is required")
    private String rue;

    @NotBlank(message = "City is required")
    private String ville;

    @NotBlank(message = "Postal code is required")
    @Pattern(regexp = "^[0-9]{5}$", message = "Postal code must be 5 digits")
    private String codePostal;

    @NotBlank(message = "Country is required")
    private String pays;
}
