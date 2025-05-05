package com.pedro.algorithm_visualizer.services;

import java.util.List;
import java.util.UUID;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.pedro.algorithm_visualizer.configurations.SecurityConfiguration;
import com.pedro.algorithm_visualizer.models.DTO.JwtTokenDTO;
import com.pedro.algorithm_visualizer.models.DTO.LoginUserDTO;
import com.pedro.algorithm_visualizer.models.DTO.RegisterUserDTO;
import com.pedro.algorithm_visualizer.models.DTO.UserDTO;
import com.pedro.algorithm_visualizer.models.Role;
import com.pedro.algorithm_visualizer.models.User;
import com.pedro.algorithm_visualizer.models.UserDetailsImpl;
import com.pedro.algorithm_visualizer.models.enums.RoleName;
import com.pedro.algorithm_visualizer.repositories.GraphRepository;
import com.pedro.algorithm_visualizer.repositories.UserRepository;

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

        UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
                loginUserDTO.email(), loginUserDTO.password());

        Authentication authentication = authenticationManager.authenticate(usernamePasswordAuthenticationToken);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        return new JwtTokenDTO(jwtTokenService.generateToken(userDetails));
    }

    public UserDTO getUserInfo() {
        User user = this.userDetailsService.getLoggedUser();
        
        UserDTO userDTO = new UserDTO(user.getName(), user.getPhoto());

        return userDTO;
    }

    public void createUser(RegisterUserDTO registerUserDTO) {

        Role userRole = new Role();
        userRole.setName(RoleName.ROLE_USER);

        User newUser = new User(
                registerUserDTO.name(),
                registerUserDTO.email(),
                securityConfiguration.passwordEncoder().encode(registerUserDTO.password()),
                List.of(userRole));

        userRepository.save(newUser);
    }

    public List<UUID> getUserGraphsIds() {

        User user = this.userDetailsService.getLoggedUser();

        return this.graphRepository.findGraphIdsByUserId(user.getId());
    }
}
