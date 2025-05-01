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
import com.pedro.algorithm_visualizer.models.DTO.RegisterUserDTO;
import com.pedro.algorithm_visualizer.services.UserService;

@RestController
@RequestMapping("/users")
public class UserController {

    private UserService userService;

    UserController(UserService userService){
        this.userService = userService;
    }
    
    @PostMapping("/login")
    public ResponseEntity<JwtTokenDTO> authenticateUser(@RequestBody LoginUserDTO loginUserDTO) {
        JwtTokenDTO token = userService.authenticateUser(loginUserDTO);
        return new ResponseEntity<>(token, HttpStatus.OK);
    }

    @PostMapping("/register")   
    public ResponseEntity<Void> createUser(@RequestBody RegisterUserDTO registerUserDTO) {

        userService.createUser(registerUserDTO);
        
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/graphs/id")   
    public ResponseEntity<List<UUID>> getUserGraphsIds() {

        List<UUID> graphsIds = userService.getUserGraphsIds();

        return ResponseEntity.ok(graphsIds);
    }

    @GetMapping("/matrices")   
    public ResponseEntity<Void> getUserMatrices() {
        
        return ResponseEntity.ok().build();
    }
}
