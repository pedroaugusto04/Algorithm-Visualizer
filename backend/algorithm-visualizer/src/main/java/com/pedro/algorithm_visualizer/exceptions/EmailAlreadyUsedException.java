package com.pedro.algorithm_visualizer.exceptions;

public class EmailAlreadyUsedException extends RuntimeException {

    public EmailAlreadyUsedException()  {

    }

    public EmailAlreadyUsedException(String message) {
        super(message);
    }
}
