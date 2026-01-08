package com.pedro.algorithm_visualizer.services;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.pedro.algorithm_visualizer.configurations.SecurityConfiguration;
import com.pedro.algorithm_visualizer.models.DTO.JwtTokenDTO;
import com.pedro.algorithm_visualizer.models.DTO.LoginUserDTO;
import com.pedro.algorithm_visualizer.models.DTO.ProfileDTO;
import com.pedro.algorithm_visualizer.models.DTO.RegisterUserDTO;
import com.pedro.algorithm_visualizer.models.DTO.UserDTO;
import com.pedro.algorithm_visualizer.models.Role;
import com.pedro.algorithm_visualizer.models.User;
import com.pedro.algorithm_visualizer.models.UserDetailsImpl;
import com.pedro.algorithm_visualizer.models.enums.RoleName;
import com.pedro.algorithm_visualizer.repositories.GraphRepository;
import com.pedro.algorithm_visualizer.repositories.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

@Service
public class UserService {

    private UserRepository userRepository;
    private AuthenticationManager authenticationManager;
    private JwtTokenService jwtTokenService;
    private SecurityConfiguration securityConfiguration;
    private GraphRepository graphRepository;
    private UserDetailsServiceImpl userDetailsService;

    UserService(UserRepository userRepository, AuthenticationManager authenticationManager,
            JwtTokenService jwtTokenService,
            SecurityConfiguration securityConfiguration, GraphRepository graphRepository,
            UserDetailsServiceImpl userDetailsService) {
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;
        this.jwtTokenService = jwtTokenService;
        this.securityConfiguration = securityConfiguration;
        this.graphRepository = graphRepository;
        this.userDetailsService = userDetailsService;
    }

    public JwtTokenDTO authenticateUser(LoginUserDTO loginUserDTO) {

        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                loginUserDTO.email(), loginUserDTO.password());

        Authentication authentication = authenticationManager.authenticate(authToken);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        return new JwtTokenDTO(jwtTokenService.generateToken(userDetails));
    }

    public JwtTokenDTO authenticateGoogleUser(User user) {
        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        Authentication authentication =
                new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        return new JwtTokenDTO(jwtTokenService.generateToken(userDetails));
    }

    public UserDTO getUserInfo() {
        User user = this.userDetailsService.getLoggedUser();

        return new UserDTO(user.getName(), user.getPhoto());
    }

    public Optional<User> getUserByEmailAndGoogleId(String email, String googleId) {
        return this.userRepository.findByEmailAndGoogleId(email,googleId);
    }

    public Optional<User> getUserByEmail(String email) {
        return this.userRepository.findByEmail(email);
    }

    @Transactional
    public ProfileDTO getProfileInfo() {
        User loggedUser = this.userDetailsService.getLoggedUser();

        User user = this.userRepository.findById(loggedUser.getId()).orElseThrow(() -> new EntityNotFoundException());

        return new ProfileDTO(user.getName(), user.getEmail(), user.getPhoto(), user.getCreatedAt(),
                user.getGraphs().size(), 0);
    }

    public void createUser(RegisterUserDTO registerUserDTO) {

        Role userRole = new Role();
        userRole.setName(RoleName.ROLE_USER);

        String encodedPassword = registerUserDTO.password() != null
                ? securityConfiguration.passwordEncoder().encode(registerUserDTO.password())
                : null;

        User newUser = new User(
                registerUserDTO.name(),
                registerUserDTO.email(),
                encodedPassword,
                registerUserDTO.googleId(),
                Set.of(userRole));

        userRepository.save(newUser);
    }

    public List<UUID> getUserGraphsIds() {

        User user = this.userDetailsService.getLoggedUser();

        return this.graphRepository.findGraphIdsByUserId(user.getId());
    }
}
