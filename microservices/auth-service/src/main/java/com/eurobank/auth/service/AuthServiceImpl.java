package com.eurobank.auth.service;

import com.eurobank.auth.dto.*;
import com.eurobank.auth.entity.PasswordResetToken;
import com.eurobank.auth.entity.RefreshToken;
import com.eurobank.auth.entity.User;
import com.eurobank.auth.exception.InvalidCredentialsException;
import com.eurobank.auth.exception.InvalidTokenException;
import com.eurobank.auth.exception.UserAlreadyExistsException;
import com.eurobank.auth.exception.UserNotFoundException;
import com.eurobank.auth.repository.PasswordResetTokenRepository;
import com.eurobank.auth.repository.UserRepository;
import com.eurobank.auth.security.JwtTokenProvider;
import com.eurobank.auth.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long PASSWORD_RESET_TOKEN_EXPIRATION = 3600000; // 1 hour

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        log.info("Login attempt for username: {}", request.getUsername());

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));

        if (user.getAccountLocked()) {
            log.warn("Login attempt for locked account: {}", request.getUsername());
            throw new InvalidCredentialsException("Account is locked. Please contact support.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            // Reset failed login attempts on successful login
            if (user.getFailedLoginAttempts() > 0) {
                userRepository.updateFailedLoginAttempts(user.getId(), 0);
            }

            // Update last login date
            userRepository.updateLastLoginDate(user.getId(), LocalDateTime.now());

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String accessToken = jwtTokenProvider.generateToken(authentication);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getId());

            log.info("User logged in successfully: {}", request.getUsername());

            return LoginResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken.getToken())
                    .tokenType("Bearer")
                    .expiresIn(jwtTokenProvider.getExpirationTime() / 1000)
                    .user(mapToUserResponse(user))
                    .build();

        } catch (AuthenticationException e) {
            handleFailedLogin(user);
            throw new InvalidCredentialsException("Invalid username or password");
        }
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        log.info("Registration attempt for username: {}", request.getUsername());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists: " + request.getUsername());
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists: " + request.getEmail());
        }

        Set<String> roles = new HashSet<>();
        roles.add("ROLE_USER");

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .enabled(true)
                .twoFaEnabled(false)
                .accountLocked(false)
                .failedLoginAttempts(0)
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", request.getUsername());

        return mapToUserResponse(savedUser);
    }

    @Override
    @Transactional
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        log.info("Refresh token request");

        RefreshToken refreshToken = refreshTokenService.findByToken(request.getRefreshToken());
        refreshTokenService.verifyExpiration(refreshToken);

        User user = refreshToken.getUser();
        String roles = user.getRoles().stream()
                .collect(Collectors.joining(","));

        String accessToken = jwtTokenProvider.generateTokenFromUsername(
                user.getUsername(),
                user.getId(),
                roles
        );

        log.info("Access token refreshed for user: {}", user.getUsername());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationTime() / 1000)
                .user(mapToUserResponse(user))
                .build();
    }

    @Override
    @Transactional
    public void logout(String token) {
        log.info("Logout request");
        if (token != null) {
            refreshTokenService.revokeToken(token);
            log.info("User logged out successfully");
        }
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        log.info("Forgot password request for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> UserNotFoundException.byEmail(request.getEmail()));

        // Delete any existing password reset tokens for this user
        passwordResetTokenRepository.deleteByUserId(user.getId());

        // Create new password reset token
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiryDate(Instant.now().plusMillis(PASSWORD_RESET_TOKEN_EXPIRATION))
                .createdDate(Instant.now())
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        // TODO: Send email with reset link
        log.info("Password reset token created for user: {}. Token: {}", user.getUsername(), resetToken.getToken());
        log.info("In production, send email to: {} with reset link", request.getEmail());
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        log.info("Reset password request");

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new InvalidTokenException("Invalid password reset token"));

        if (resetToken.isExpired()) {
            throw new InvalidTokenException("Password reset token has expired");
        }

        if (resetToken.getUsed()) {
            throw new InvalidTokenException("Password reset token has already been used");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Mark token as used
        passwordResetTokenRepository.markTokenAsUsed(request.getToken());

        // Revoke all refresh tokens
        refreshTokenService.revokeAllUserTokens(user.getId());

        log.info("Password reset successfully for user: {}", user.getUsername());
    }

    private void handleFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        userRepository.updateFailedLoginAttempts(user.getId(), attempts);

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            userRepository.updateAccountLocked(user.getId(), true);
            log.warn("Account locked due to failed login attempts: {}", user.getUsername());
        }

        log.warn("Failed login attempt {} for user: {}", attempts, user.getUsername());
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(user.getRoles())
                .enabled(user.getEnabled())
                .twoFaEnabled(user.getTwoFaEnabled())
                .lastLoginDate(user.getLastLoginDate())
                .createdDate(user.getCreatedDate())
                .build();
    }
}
