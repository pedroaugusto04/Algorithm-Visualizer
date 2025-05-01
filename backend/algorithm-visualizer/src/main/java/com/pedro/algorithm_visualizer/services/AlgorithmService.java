package com.pedro.algorithm_visualizer.services;

import org.springframework.stereotype.Service;

import com.pedro.algorithm_visualizer.repositories.AlgorithmRepository;

@Service
public class AlgorithmService {

    private AlgorithmRepository algorithmRepository;

    AlgorithmService(AlgorithmRepository algorithmRepository) {
        this.algorithmRepository = algorithmRepository;
    }
}
