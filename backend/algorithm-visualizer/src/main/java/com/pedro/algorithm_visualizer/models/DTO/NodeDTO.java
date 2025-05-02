package com.pedro.algorithm_visualizer.models.DTO;

import com.pedro.algorithm_visualizer.models.Node;

public class NodeDTO {

    private Integer value;

    public NodeDTO() {}

    public NodeDTO(Integer value){
        this.value = value;
    }

    public NodeDTO(String value){
        this.value = Integer.valueOf(value);
    }

    public NodeDTO(Node node){
        this.value = Integer.valueOf(node.getValue());
    }

    public Integer getValue() {
        return value;
    }

    public void setValue(Integer value) {
        this.value = value;
    }


}
