package com.pedro.algorithm_visualizer.services;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.pedro.algorithm_visualizer.models.UserDetailsImpl;

@Service
public class JwtTokenService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.issuer}")
    private String issuer;

    public String generateToken(UserDetailsImpl user) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(this.secretKey);
            return JWT.create()
                    .withIssuer(this.issuer) 
                    .withIssuedAt(creationDate()) 
                    .withExpiresAt(expirationDate()) 
                    .withSubject(user.getUsername()) 
                    .sign(algorithm); 
        } catch (JWTCreationException exception) {
            throw new JWTCreationException("Erro ao gerar token.", exception);
        }
    }

    public String getSubjectFromToken(String token) {
        try {

            Algorithm algorithm = Algorithm.HMAC256(this.secretKey);
            return JWT.require(algorithm)
                    .withIssuer(this.issuer) 
                    .build()
                    .verify(token) 
                    .getSubject(); 
        } catch (JWTVerificationException exception) {
            throw new JWTVerificationException("Token not valid or expired");
        }
    }

    private Instant creationDate() {
        return ZonedDateTime.now(ZoneId.of("America/Sao_Paulo")).toInstant();
    }

    private Instant expirationDate() {
        return ZonedDateTime.now(ZoneId.of("America/Sao_Paulo")).plusHours(4).toInstant();
    }

}