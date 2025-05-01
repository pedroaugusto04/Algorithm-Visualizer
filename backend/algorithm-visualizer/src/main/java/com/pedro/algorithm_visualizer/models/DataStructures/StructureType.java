package com.pedro.algorithm_visualizer.models.DataStructures;


import java.util.Set;
import java.util.UUID;

import com.pedro.algorithm_visualizer.models.Algorithm;
import com.pedro.algorithm_visualizer.models.enums.StructureTypeEnum;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;

@Entity
public class StructureType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(unique = true, nullable = false)
    private StructureTypeEnum name;

    public StructureType() {}

    public StructureType(StructureTypeEnum name) {
        this.name = name;
    }

    @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.PERSIST)
    @JoinTable(
        name = "algorithm_structure_type",
        joinColumns = @JoinColumn(name = "structure_type_id"),
        inverseJoinColumns = @JoinColumn(name = "algorithm_id")
    )
    private Set<Algorithm> supportedAlgorithms;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Set<Algorithm> getSupportedAlgorithms() {
        return supportedAlgorithms;
    }

    public void setSupportedAlgorithms(Set<Algorithm> supportedAlgorithms) {
        this.supportedAlgorithms = supportedAlgorithms;
    }

    public StructureTypeEnum getName() {
        return name;
    }

    public void setName(StructureTypeEnum name) {
        this.name = name;
    }

}