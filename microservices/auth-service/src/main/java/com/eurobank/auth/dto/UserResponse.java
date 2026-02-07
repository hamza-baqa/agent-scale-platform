package com.eurobank.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User information response")
public class UserResponse {

    @Schema(description = "User ID", example = "1")
    private Long id;

    @Schema(description = "Username", example = "john.doe")
    private String username;

    @Schema(description = "Email address", example = "john.doe@example.com")
    private String email;

    @Schema(description = "First name", example = "John")
    private String firstName;

    @Schema(description = "Last name", example = "Doe")
    private String lastName;

    @Schema(description = "User roles", example = "[\"ROLE_USER\"]")
    private Set<String> roles;

    @Schema(description = "Account enabled status", example = "true")
    private Boolean enabled;

    @Schema(description = "Two-factor authentication enabled", example = "false")
    private Boolean twoFaEnabled;

    @Schema(description = "Last login date", example = "2026-02-05T10:30:00")
    private LocalDateTime lastLoginDate;

    @Schema(description = "Account creation date", example = "2026-01-01T09:00:00")
    private LocalDateTime createdDate;
}
