package com.pedro.algorithm_visualizer.models.DTO;

public record UserDTO(String name, String photo) {
    
    public UserDTO(String name) {
        this(name, null);
    }
}