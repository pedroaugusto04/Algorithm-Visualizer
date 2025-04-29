package com.pedro.algorithm_visualizer.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pedro.algorithm_visualizer.models.DTO.UserDTO;
import com.pedro.algorithm_visualizer.models.DataStructures.Graph;
import com.pedro.algorithm_visualizer.models.User;
import com.pedro.algorithm_visualizer.services.UserService;

@RestController
@RequestMapping("/user")
public class UserController {

    private UserService userService;

    UserController(UserService userService){
    }
    
    @PostMapping("/create")
    public ResponseEntity<Void> createGraphUndirectedUnweighted(@RequestBody UserDTO user) {

       //User user = modelMapper.map(userDTO, User.class);
    //userService.saveUser(user);
     return ResponseEntity.ok().build();

    }
}
