package com.pedro.algorithm_visualizer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.pedro.algorithm_visualizer")
@EnableJpaRepositories(basePackages="com.pedro.algorithm_visualizer.repositories")
public class AlgorithmVisualizerApplication {

	public static void main(String[] args) {
		SpringApplication.run(AlgorithmVisualizerApplication.class, args);
	}

}
