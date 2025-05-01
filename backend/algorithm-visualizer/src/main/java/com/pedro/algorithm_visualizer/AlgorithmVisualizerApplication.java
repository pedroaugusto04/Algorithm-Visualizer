package com.pedro.algorithm_visualizer;

import java.util.HashSet;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import com.pedro.algorithm_visualizer.models.Algorithm;
import com.pedro.algorithm_visualizer.models.DataStructures.StructureType;
import com.pedro.algorithm_visualizer.models.enums.AlgorithmEnum;
import com.pedro.algorithm_visualizer.models.enums.StructureTypeEnum;
import com.pedro.algorithm_visualizer.repositories.AlgorithmRepository;
import com.pedro.algorithm_visualizer.repositories.StructureTypeRepository;

@SpringBootApplication(scanBasePackages = "com.pedro.algorithm_visualizer")
@EnableJpaRepositories(basePackages = "com.pedro.algorithm_visualizer.repositories")
public class AlgorithmVisualizerApplication {

    public static void main(String[] args) {
        SpringApplication.run(AlgorithmVisualizerApplication.class, args);
    }

    @Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner loadData(
            StructureTypeRepository structureTypeRepository,
            AlgorithmRepository algorithmRepository) {
        return args -> {

            for (StructureTypeEnum typeEnum : StructureTypeEnum.values()) {
                structureTypeRepository.findByName(typeEnum)
                        .orElseGet(() -> structureTypeRepository.save(new StructureType(typeEnum)));
            }

            for (AlgorithmEnum algorithmEnum : AlgorithmEnum.values()) {
                algorithmRepository.findByName(algorithmEnum)
                        .orElseGet(() -> algorithmRepository.save(new Algorithm(algorithmEnum)));
            }


            // GRAPH
            StructureType directedUnweightedGraph = structureTypeRepository.findByName(StructureTypeEnum.DIRECTED_UNWEIGHTED_GRAPH).orElseThrow();
            StructureType undirectedUnweightedGraph = structureTypeRepository.findByName(StructureTypeEnum.UNDIRECTED_UNWEIGHTED_GRAPH).orElseThrow();
            StructureType directedWeightedGraph = structureTypeRepository.findByName(StructureTypeEnum.DIRECTED_WEIGHTED_GRAPH).orElseThrow();
            StructureType undirectedWeightedGraph = structureTypeRepository.findByName(StructureTypeEnum.UNDIRECTED_WEIGHTED_GRAPH).orElseThrow();

            Set<StructureType> allTypes = new HashSet<>();

            allTypes.add(directedWeightedGraph);
            allTypes.add(undirectedWeightedGraph);
            allTypes.add(directedUnweightedGraph);
            allTypes.add(undirectedUnweightedGraph);

            // DFS
            Algorithm algorithm = algorithmRepository.findByName(AlgorithmEnum.DFS)
                    .orElseGet(() -> algorithmRepository.save(new Algorithm(AlgorithmEnum.DFS)));
                    
            Set<StructureType> supportedTypes = new HashSet<>();
            
            supportedTypes.add(directedWeightedGraph);
            supportedTypes.add(undirectedWeightedGraph);
            supportedTypes.add(directedUnweightedGraph);
            supportedTypes.add(undirectedUnweightedGraph);

            for (StructureType structureType : supportedTypes) {
                if (!structureType.getSupportedAlgorithms().contains(algorithm)) {
                    structureType.getSupportedAlgorithms().add(algorithm);
                }
            }

            algorithm.setSupportedStructureTypes(supportedTypes);
            algorithmRepository.save(algorithm);

            // BFS
            algorithm = algorithmRepository.findByName(AlgorithmEnum.BFS)
                    .orElseGet(() -> algorithmRepository.save(new Algorithm(AlgorithmEnum.BFS)));

            supportedTypes = new HashSet<>();
            supportedTypes.add(directedWeightedGraph);
            supportedTypes.add(undirectedWeightedGraph);
            supportedTypes.add(directedUnweightedGraph);
            supportedTypes.add(undirectedUnweightedGraph);

            for (StructureType structureType : supportedTypes) {
                if (!structureType.getSupportedAlgorithms().contains(algorithm)) {
                    structureType.getSupportedAlgorithms().add(algorithm);
                }
            }

            algorithm.setSupportedStructureTypes(supportedTypes);
            algorithmRepository.save(algorithm);

            // DIJKSTRA
            algorithm = algorithmRepository.findByName(AlgorithmEnum.DIJKSTRA)
                    .orElseGet(() -> algorithmRepository.save(new Algorithm(AlgorithmEnum.DIJKSTRA)));

            supportedTypes = new HashSet<>();
            supportedTypes.add(undirectedWeightedGraph);
            supportedTypes.add(directedWeightedGraph);

            for (StructureType structureType : supportedTypes) {
                if (!structureType.getSupportedAlgorithms().contains(algorithm)) {
                    structureType.getSupportedAlgorithms().add(algorithm);
                }
            }

            algorithm.setSupportedStructureTypes(supportedTypes);
            algorithmRepository.save(algorithm);


            structureTypeRepository.saveAll(allTypes);
        };
    }
}

}