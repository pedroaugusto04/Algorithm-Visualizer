package com.pedro.algorithm_visualizer.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pedro.algorithm_visualizer.models.DTO.JwtTokenDTO;
import com.pedro.algorithm_visualizer.models.DTO.LoginUserDTO;
import com.pedro.algorithm_visualizer.models.DTO.RegisterUserDTO;
import com.pedro.algorithm_visualizer.services.UserService;

@RestController
@RequestMapping("/user")
public class UserController {

    private UserService userService;

    UserController(UserService userService){
    }
    
    @PostMapping("/login")
    public ResponseEntity<JwtTokenDTO> authenticateUser(@RequestBody LoginUserDTO loginUserDto) {
        JwtTokenDTO token = userService.authenticateUser(loginUserDto);
        return new ResponseEntity<>(token, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<Void> createUser(@RequestBody RegisterUserDTO registerUserDTO) {
        userService.createUser(registerUserDTO);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }
}
