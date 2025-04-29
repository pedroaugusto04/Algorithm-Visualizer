package com.pedro.algorithm_visualizer.models;

import java.util.UUID;

import com.pedro.algorithm_visualizer.models.DataStructures.DataStructure;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Execution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "data_structure_id")
    private DataStructure dataStructure;
}