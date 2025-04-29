package com.pedro.algorithm_visualizer.services;

import org.springframework.stereotype.Service;
import com.pedro.algorithm_visualizer.models.User;
import com.pedro.algorithm_visualizer.repositories.UserRepository;

@Service
public class UserService {

    private UserRepository userRepository;
    
    UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void saveUser(User user)  {
        this.userRepository.save(user);
    }
}
