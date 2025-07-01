package com.pedro.algorithm_visualizer.services;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.pedro.algorithm_visualizer.exceptions.GeminiApiException;

@Service
public class GeminiService { 

    private final RestTemplate restTemplate;

    private final String geminiApiUrl;
    private final String geminiApiKey;

    public GeminiService(
        @Value("${gemini.api.url}") String geminiApiUrl,
        @Value("${gemini.api.key}") String geminiApiKey
    ) {
        this.restTemplate = new RestTemplate();
        this.geminiApiUrl = geminiApiUrl;
        this.geminiApiKey = geminiApiKey;
    }

    public String getAIExplanation(String prompt) {

        String url = geminiApiUrl + "?key=" + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> content = Map.of(
            "parts", List.of(Map.of("text", prompt))
        );
        Map<String, Object> generationConfig = Map.of(
            "temperature", 0.0 
        );

        Map<String, Object> body = Map.of(
            "contents", List.of(content),
            "generationConfig", generationConfig
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> firstCandidate = candidates.get(0);
                    
                    if (firstCandidate.containsKey("finishReason") && "SAFETY".equals(firstCandidate.get("finishReason"))) {
                        throw new GeminiApiException();
                    }
                    
                    Map<String, Object> contentPart = (Map<String, Object>) firstCandidate.get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) contentPart.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
        } catch (Exception e) {
            throw new GeminiApiException();
        }
        
        return "";
    }
}