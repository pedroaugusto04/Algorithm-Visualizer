package com.pedro.algorithm_visualizer.models.DataStructures;

import java.util.UUID;

import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "structure_type")
public abstract class DataStructure {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

}