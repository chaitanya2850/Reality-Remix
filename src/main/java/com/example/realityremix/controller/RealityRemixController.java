package com.example.realityremix.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reality-remix")
@CrossOrigin(origins = "*")
public class RealityRemixController {

    private final RestClient restClient;

    public RealityRemixController(
            @Value("${ollama.url:http://localhost:11434}") String ollamaUrl
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(ollamaUrl)
                .build();
    }

    /*
     * CREATE CHALLENGE
     */
    @PostMapping(
            value = "/analyze",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public Map<String, Object> analyze(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "challengeNumber", defaultValue = "1")
            int challengeNumber
    ) throws IOException {

        String base64Image = Base64.getEncoder()
                .encodeToString(image.getBytes());

        String prompt = """
                You are Reality Remix.

                This is challenge number %d in the user's outdoor adventure.

                Analyze this image and create ONE safe, real-world challenge
                based ONLY on what is actually visible.

                Rules:
                - Identify important visible objects and surroundings.
                - Do not invent objects.
                - Create a fresh challenge suitable for challenge number %d.
                - The challenge should encourage physical observation or exploration.
                - Do not require a computer, phone, internet, or social media.
                - Do not ask the user to touch, climb, damage, or approach anything dangerous.
                - Keep the challenge under 5 minutes.
                - Prefer movement or exploration when the environment allows it.
                - Make the challenge different in spirit from a simple counting task
                  when possible.
                - The user should be able to complete it in the real world.

                Return exactly:

                OBJECTS:
                [list of important visible objects]

                CHALLENGE:
                [one short physical-world challenge]

                WHY:
                [one sentence explaining why the visible environment enables it]
                """.formatted(challengeNumber, challengeNumber);

        Map<String, Object> request = Map.of(
                "model", "gemma3:4b",
                "prompt", prompt,
                "images", new String[]{base64Image},
                "stream", false
        );

        Map response = restClient.post()
                .uri("/api/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(Map.class);

        return Map.of(
                "challenge", response.get("response"),
                "challengeNumber", challengeNumber
        );
    }


    /*
     * CHAT
     */
    @PostMapping(
            value = "/chat",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public Map<String, Object> chat(
            @RequestBody ChatRequest request
    ) {

        String conversation = buildConversation(request.messages());

        String prompt = """
                You are the Reality Remix Challenge Assistant.

                The user is currently completing this challenge:

                %s

                Your job is to have a natural conversation with the user
                and help them understand the challenge.

                IMPORTANT RULES:

                - Remember and use the previous messages in the conversation.
                - Answer naturally like a helpful person.
                - Explain things in simple language.
                - You may answer follow-up questions.
                - Do not create a different challenge.
                - Do not change the goal of the current challenge.
                - Do not invent objects that were not part of the challenge.
                - Do not require a computer, phone, internet, or social media.
                - If the user asks whether something is allowed, answer based
                  on the original challenge.
                - If movement is involved, encourage safe behavior.
                - Keep responses reasonably short.
                - The purpose of Reality Remix is to get the user back into
                  the real world, so do not encourage unnecessary chatting.

                Previous conversation:

                %s

                Respond to the user's latest message.
                """.formatted(
                request.challenge(),
                conversation
        );

        Map<String, Object> ollamaRequest = Map.of(
                "model", "gemma3:4b",
                "prompt", prompt,
                "stream", false
        );

        Map response = restClient.post()
                .uri("/api/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .body(ollamaRequest)
                .retrieve()
                .body(Map.class);

        return Map.of(
                "answer",
                response.get("response")
        );
    }


    /*
     * Convert chat history into a simple prompt.
     */
    private String buildConversation(List<ChatMessage> messages) {

        if (messages == null || messages.isEmpty()) {
            return "No previous conversation.";
        }

        StringBuilder conversation = new StringBuilder();

        for (ChatMessage message : messages) {

            String role = message.role();
            String content = message.content();

            if ("user".equalsIgnoreCase(role)) {
                conversation.append("USER: ");
            } else {
                conversation.append("ASSISTANT: ");
            }

            conversation.append(content);
            conversation.append("\n\n");
        }

        return conversation.toString();
    }


    /*
     * Request models
     */
    public record ChatRequest(
            String challenge,
            List<ChatMessage> messages
    ) {
    }

    public record ChatMessage(
            String role,
            String content
    ) {
    }
}
