package com.eurobank.auth.service;

import com.eurobank.auth.entity.RefreshToken;
import com.eurobank.auth.entity.User;
import com.eurobank.auth.exception.InvalidTokenException;
import com.eurobank.auth.exception.TokenExpiredException;
import com.eurobank.auth.repository.RefreshTokenRepository;
import com.eurobank.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Value("${jwt.refresh-expiration:604800000}")
    private Long refreshTokenDurationMs;

    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshTokenDurationMs))
                .createdDate(Instant.now())
                .revoked(false)
                .build();

        log.info("Creating refresh token for user: {}", user.getUsername());
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional(readOnly = true)
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.isExpired()) {
            log.warn("Refresh token expired for user: {}", token.getUser().getUsername());
            throw new TokenExpiredException("Refresh token has expired. Please login again.");
        }

        if (token.getRevoked()) {
            log.warn("Refresh token revoked for user: {}", token.getUser().getUsername());
            throw new InvalidTokenException("Refresh token has been revoked");
        }

        return token;
    }

    @Transactional(readOnly = true)
    public RefreshToken findByToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));
    }

    @Transactional
    public void revokeToken(String token) {
        log.info("Revoking refresh token");
        refreshTokenRepository.revokeToken(token);
    }

    @Transactional
    public void revokeAllUserTokens(Long userId) {
        log.info("Revoking all tokens for user id: {}", userId);
        refreshTokenRepository.revokeAllUserTokens(userId);
    }

    @Transactional
    public void deleteExpiredTokens() {
        log.info("Deleting expired refresh tokens");
        refreshTokenRepository.deleteExpiredTokens(Instant.now());
    }
}
