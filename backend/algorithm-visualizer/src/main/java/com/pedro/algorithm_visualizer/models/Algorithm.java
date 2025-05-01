package com.pedro.algorithm_visualizer.models;

import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pedro.algorithm_visualizer.models.DataStructures.StructureType;
import com.pedro.algorithm_visualizer.models.enums.AlgorithmEnum;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;

@Entity
public class Algorithm {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(unique = true, nullable = false)
    private AlgorithmEnum name;

    @ManyToMany(mappedBy = "supportedAlgorithms")
    @JsonIgnore
    private Set<StructureType> supportedStructureTypes;

    public Algorithm() {}
    
    public Algorithm(AlgorithmEnum name){
        this.name = name;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Set<StructureType> getSupportedStructureTypes() {
        return supportedStructureTypes;
    }

    public void setSupportedStructureTypes(Set<StructureType> supportedStructureTypes) {
        this.supportedStructureTypes = supportedStructureTypes;
    }

    public AlgorithmEnum getName() {
        return name;
    }

    public void setName(AlgorithmEnum name) {
        this.name = name;
    }
}
