package plasmapi.project.plasma.service.security;

import io.jsonwebtoken.JwtException;
import io.micrometer.common.util.StringUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtCookieFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    // Константы
    private static final String JWT_COOKIE_NAME = "jwt";
    private static final int REFRESH_THRESHOLD_MINUTES = 15;
    private static final int COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60; // 24 часа

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractTokenFromCookie(request);

        // Fallback для обратной совместимости
        if (token == null) {
            token = extractTokenFromHeader(request);
        }

        if (token != null) {
            try {
                processToken(token, request, response);
            } catch (JwtException ex) {
                handleJwtException(ex, response);
            } catch (Exception ex) {
                log.error("Unexpected error during authentication: {}", ex.getMessage(), ex);
            }
        }

        filterChain.doFilter(request, response);
    }

    private void processToken(String token,
                              HttpServletRequest request,
                              HttpServletResponse response) {
        String username = jwtService.extractUserName(token);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtService.isTokenValid(token, userDetails)) {
                setAuthentication(userDetails, request);
                refreshTokenIfNeeded(token, userDetails, request, response);
                log.debug("Authenticated user: {}", username);
            } else {
                log.debug("Invalid token for user: {}", username);
                clearJwtCookie(response);
            }
        }
    }

    private void setAuthentication(UserDetails userDetails, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
    }

    private void refreshTokenIfNeeded(String token,
                                      UserDetails userDetails,
                                      HttpServletRequest request,
                                      HttpServletResponse response) {
        try {
            Instant expiration = jwtService.extractExpiration(token);
            Instant now = Instant.now();
            Duration timeLeft = Duration.between(now, expiration);

            if (timeLeft.toMinutes() < REFRESH_THRESHOLD_MINUTES) {
                String newToken = jwtService.generateToken(userDetails);
                boolean isSecure = request.isSecure() ||
                        request.getHeader("X-Forwarded-Proto") != null;
                setJwtCookie(response, newToken, isSecure);
                log.debug("Token refreshed for user: {}", userDetails.getUsername());
            }
        } catch (Exception e) {
            log.debug("Could not refresh token: {}", e.getMessage());
        }
    }

    private void handleJwtException(JwtException ex, HttpServletResponse response) {
        log.debug("JWT validation failed: {}", ex.getMessage());
        clearJwtCookie(response);

        // Только для API запросов возвращаем 401
        if (isApiRequest()) {
            try {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"error\":\"Invalid or expired token\"}");
            } catch (IOException e) {
                log.error("Failed to write error response: {}", e.getMessage());
            }
        }
    }

    private boolean isApiRequest() {
        // Реализуйте логику определения API запросов
        // Например, по заголовку Accept или пути
        return true;
    }

    private String extractTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (JWT_COOKIE_NAME.equals(cookie.getName())) {
                    String token = cookie.getValue();
                    if (StringUtils.isNotBlank(token)) {
                        return token;
                    }
                }
            }
        }
        return null;
    }

    private String extractTokenFromHeader(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.isNotBlank(header) && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            if (!token.isEmpty()) {
                return token;
            }
        }
        return null;
    }

    public void setJwtCookie(HttpServletResponse response, String token, boolean isSecure) {
        String cookieValue = String.format(
                "%s=%s; HttpOnly; Path=/; Max-Age=%d; SameSite=Lax%s",
                JWT_COOKIE_NAME,
                token,
                COOKIE_MAX_AGE_SECONDS,
                isSecure ? "; Secure" : ""
        );

        response.addHeader("Set-Cookie", cookieValue);
    }

    public void setJwtCookie(HttpServletResponse response, String token) {
        // По умолчанию для production используем Secure
        setJwtCookie(response, token, true);
    }

    public void clearJwtCookie(HttpServletResponse response) {
        String cookieValue = String.format(
                "%s=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure",
                JWT_COOKIE_NAME
        );

        response.addHeader("Set-Cookie", cookieValue);
    }

    public boolean hasValidToken(HttpServletRequest request) {
        String token = extractTokenFromCookie(request);
        if (token == null) {
            token = extractTokenFromHeader(request);
        }

        if (token == null) {
            return false;
        }

        try {
            String username = jwtService.extractUserName(token);
            if (username == null) {
                return false;
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            return jwtService.isTokenValid(token, userDetails);
        } catch (Exception e) {
            log.debug("Token validation failed: {}", e.getMessage());
            return false;
        }
    }
}
