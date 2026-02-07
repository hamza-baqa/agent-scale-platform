package com.eurobank.client.dto;

import com.eurobank.client.entity.ClientType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for creating or updating a client
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientRequest {

    @NotBlank(message = "Last name is required")
    private String nom;

    @NotBlank(message = "First name is required")
    private String prenom;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String telephone;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateNaissance;

    @NotNull(message = "Client type is required")
    private ClientType type;

    @NotNull(message = "User ID is required")
    private Long userId;

    @Valid
    private AddressDto address;
}
