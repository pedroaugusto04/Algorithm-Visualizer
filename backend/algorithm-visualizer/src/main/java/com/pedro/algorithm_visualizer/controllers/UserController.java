package com.pedro.algorithm_visualizer.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pedro.algorithm_visualizer.models.DTO.JwtTokenDTO;
import com.pedro.algorithm_visualizer.models.DTO.LoginUserDTO;
import com.pedro.algorithm_visualizer.models.DTO.ProfileDTO;
import com.pedro.algorithm_visualizer.models.DTO.RegisterUserDTO;
import com.pedro.algorithm_visualizer.models.DTO.UserDTO;
import com.pedro.algorithm_visualizer.services.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/users")
@Tag(name = "User Controller", description = "Endpoints relacionados a usuários e autenticação")
public class UserController {

    private UserService userService;

    UserController(UserService userService){
        this.userService = userService;
    }

    @Operation(summary = "Obter informações do usuário logado", description = "Retorna informações básicas do usuário autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Informações do usuário retornadas com sucesso",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserDTO.class))),
        @ApiResponse(responseCode = "403", description = "Acesso proibido", content = @Content)
    })
    @GetMapping("/info")   
    public ResponseEntity<UserDTO> getUserInfo() {

        UserDTO userDTO = this.userService.getUserInfo();

        return ResponseEntity.ok(userDTO);
    }

    @Operation(summary = "Obter perfil do usuário logado", description = "Retorna dados do perfil do usuário autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Perfil do usuário retornado com sucesso",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProfileDTO.class))),
        @ApiResponse(responseCode = "403", description = "Acesso proibido", content = @Content)
    })

    @GetMapping("/profile")   
    public ResponseEntity<ProfileDTO> getProfileInfo() {

        ProfileDTO profileDTO = this.userService.getProfileInfo();

        return ResponseEntity.ok(profileDTO);
    }
    
    @Operation(summary = "Autenticar usuário", description = "Realiza login do usuário e retorna token de autenticação.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Usuário autenticado com sucesso",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = JwtTokenDTO.class))),
        @ApiResponse(responseCode = "403", description = "Credenciais inválidas", content = @Content)
    })
    @PostMapping("/login")
    public ResponseEntity<JwtTokenDTO> authenticateUser(@RequestBody LoginUserDTO loginUserDTO) {
        JwtTokenDTO token = userService.authenticateUser(loginUserDTO);

        return new ResponseEntity<>(token, HttpStatus.OK);
    }

    @Operation(summary = "Registrar novo usuário", description = "Cria um novo usuário no sistema.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Usuário criado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos para criação do usuário", content = @Content)
    })
    @PostMapping("/register")   
    public ResponseEntity<Void> createUser(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
        required = true,
        description = "Dados para registro do usuário",
        content = @Content(schema = @Schema(implementation = RegisterUserDTO.class)))
        @RequestBody RegisterUserDTO registerUserDTO) {

        userService.createUser(registerUserDTO);
        
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "Listar IDs de grafos do usuário", description = "Retorna uma lista com os UUIDs dos grafos associados ao usuário autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "IDs dos grafos retornados com sucesso",
            content = @Content(mediaType = "application/json", schema = @Schema(type = "array", implementation = UUID.class))),
        @ApiResponse(responseCode = "403", description = "Acesso proibido", content = @Content)
    })
    @GetMapping("/graphs/id")   
    public ResponseEntity<List<UUID>> getUserGraphsIds() {

        List<UUID> graphsIds = userService.getUserGraphsIds();

        return ResponseEntity.ok(graphsIds);
    }

    /* 
    @GetMapping("/matrices")   
    public ResponseEntity<Void> getUserMatrices() {
        
        return ResponseEntity.ok().build();
    }*/
}
