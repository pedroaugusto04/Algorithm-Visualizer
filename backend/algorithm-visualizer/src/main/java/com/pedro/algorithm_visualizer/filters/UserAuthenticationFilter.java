package com.pedro.algorithm_visualizer.filters;

import java.io.IOException;
import java.util.Arrays;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.pedro.algorithm_visualizer.configurations.SecurityConfiguration;
import com.pedro.algorithm_visualizer.models.User;
import com.pedro.algorithm_visualizer.models.UserDetailsImpl;
import com.pedro.algorithm_visualizer.repositories.UserRepository;
import com.pedro.algorithm_visualizer.services.JwtTokenService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class UserAuthenticationFilter extends OncePerRequestFilter {

    private JwtTokenService jwtTokenService;
    private UserRepository userRepository;

    UserAuthenticationFilter(JwtTokenService jwtTokenService, UserRepository userRepository){
        this.jwtTokenService = jwtTokenService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        // Verifica se o endpoint requer autenticacao antes de processar a requisicao
        if (checkIfEndpointIsNotPublic(request)) {
            String token = recoveryToken(request); // Recupera o token do cabecalho authorization
            if (token != null) {
                String subject = jwtTokenService.getSubjectFromToken(token); // Obtem o assunto (neste caso, o nome de usuario) do token
                User user = userRepository.findByEmail(subject).get(); // Busca o usuario pelo email (que eh o assunto do token)
                UserDetailsImpl userDetails = new UserDetailsImpl(user); // Cria um UserDetails com o usuário encontrado

                // Cria um objeto de autenticação do Spring Security
                Authentication authentication =
                        new UsernamePasswordAuthenticationToken(userDetails.getUsername(), null, userDetails.getAuthorities());

                // Define o objeto de autenticação no contexto de segurança do Spring Security
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                throw new RuntimeException("O token está ausente.");
            }
        }
        filterChain.doFilter(request, response); // Continua o processamento da requisicao
    }

    // Recupera o token do cabeçalho Authorization da requisição
    private String recoveryToken(HttpServletRequest request) {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null) {
            return authorizationHeader.replace("Bearer ", "");
        }
        return null;
    }

    // Verifica se o endpoint requer autenticacao antes de processar a requisicao
    private boolean checkIfEndpointIsNotPublic(HttpServletRequest request) {
        String requestURI = request.getRequestURI();
        return !Arrays.asList(SecurityConfiguration.UNAUTHORIZED_ENDPOINTS).contains(requestURI);
    }

}