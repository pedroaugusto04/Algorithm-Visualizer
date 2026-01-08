package com.pedro.algorithm_visualizer.services;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.pedro.algorithm_visualizer.exceptions.EmailAlreadyUsedException;
import com.pedro.algorithm_visualizer.exceptions.GoogleApiException;
import com.pedro.algorithm_visualizer.models.DTO.JwtTokenDTO;
import com.pedro.algorithm_visualizer.models.DTO.LoginUserDTO;
import com.pedro.algorithm_visualizer.models.DTO.RegisterUserDTO;
import com.pedro.algorithm_visualizer.models.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
public class GoogleLoginService {

    private UserService userService;

    GoogleLoginService(UserService userService) {
        this.userService = userService;
    }

    @Value("${google.client-id}")
    private String clientId;

    public GoogleIdToken.Payload validateToken(String token) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    JacksonFactory.getDefaultInstance()
            )
                    .setAudience(Collections.singletonList(clientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(token);

            if (idToken == null) {
                throw new GoogleApiException("Invalid Google Token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();

            return payload;

        } catch (Exception e) {
            throw new RuntimeException("Error validating Google Token", e);
        }
    }

    public JwtTokenDTO login(GoogleIdToken.Payload payload) {

        String name = (String) payload.get("name");
        String email = payload.getEmail();
        String googleId = payload.getSubject();

        Optional<User> user = this.userService.getUserByEmailAndGoogleId(email,googleId);

        if (user.isPresent()) {
            return this.userService.authenticateGoogleUser(user.get());
        }

        user = this.userService.getUserByEmail(email);

        if (user.isPresent()) {
            // usuario possui conta com o email mas nao eh do google
            throw new EmailAlreadyUsedException("Email already registered");
        }


        // nao existe nenhum usuario com esse email do google, cria a conta
        RegisterUserDTO registerUserDTO = new RegisterUserDTO(name,email,null,googleId);
        this.userService.createUser(registerUserDTO);

        // autentica
        User createdUser = this.userService.getUserByEmailAndGoogleId(email,googleId).orElseThrow(()
                -> new RuntimeException("Error creating user while google login"));

        return this.userService.authenticateGoogleUser(createdUser);

    }
}
