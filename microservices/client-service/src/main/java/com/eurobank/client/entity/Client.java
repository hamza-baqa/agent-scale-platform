package com.eurobank.client.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Client entity representing a bank client
 */
@Entity
@Table(name = "clients", indexes = {
    @Index(name = "idx_client_user_id", columnList = "user_id"),
    @Index(name = "idx_client_email", columnList = "email"),
    @Index(name = "idx_client_type", columnList = "type")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Last name is required")
    @Column(nullable = false)
    private String nom;

    @NotBlank(message = "First name is required")
    @Column(nullable = false)
    private String prenom;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank(message = "Phone number is required")
    @Column(nullable = false)
    private String telephone;

    @Past(message = "Date of birth must be in the past")
    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    @NotNull(message = "Client type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClientType type;

    @NotNull(message = "User ID is required")
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Embedded
    private Address address;

    @CreatedDate
    @Column(name = "created_date", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedDate
    @Column(name = "last_modified_date")
    private LocalDateTime lastModifiedDate;
}
