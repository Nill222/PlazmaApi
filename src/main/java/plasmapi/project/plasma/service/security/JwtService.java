package plasmapi.project.plasma.service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.security.User;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
@Slf4j
public class JwtService {

    @Value("${spring.token.signing.key}")
    private String jwtSigningKeyBase64;

    private static final Duration ACCESS_TOKEN_TTL = Duration.ofHours(1);

    public String extractUserName(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        if (userDetails instanceof User user) {
            claims.put("id", user.getId());
            claims.put("email", user.getEmail());
            claims.put("role", user.getRole().name());
        }
        return generateToken(claims, userDetails.getUsername());
    }

    private String generateToken(Map<String, Object> extraClaims, String subject) {
        Instant now = Instant.now();

        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ACCESS_TOKEN_TTL)))
                .signWith(getSigningKey())
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String username = extractUserName(token);
            return username != null &&
                    username.equals(userDetails.getUsername()) &&
                    !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException e) {
            log.debug("Failed to parse JWT: {}", e.getMessage());
            throw e;
        }
    }

    public Instant extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration).toInstant();
    }

    private boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).isBefore(Instant.now());
        } catch (JwtException e) {
            return true;
        }
    }

    private SecretKey getSigningKey() {
        if (jwtSigningKeyBase64 == null || jwtSigningKeyBase64.isBlank()) {
            throw new IllegalStateException("token.signing.key is not configured");
        }

        byte[] keyBytes = Decoders.BASE64.decode(jwtSigningKeyBase64);

        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT key is too short — need at least 256 bits (32 bytes)");
        }

        return Keys.hmacShaKeyFor(keyBytes);
    }
}
