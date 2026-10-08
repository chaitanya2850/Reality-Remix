# Reality Remix

> **Turn your surroundings into a real-world challenge.**

Reality Remix is an open-source AI project built for **Hacktoberfest 2026 — Touch Grass**.

Take a photo of your surroundings. Reality Remix uses a local open-weight vision model to understand what is actually visible and creates a short, safe physical-world challenge from it.

Instead of giving you another reason to stay on your screen, Reality Remix gives you a reason to put the phone down.

---

## How It Works

```text
Take a photo
     ↓
React Frontend
     ↓
Spring Boot Backend
     ↓
Ollama API
     ↓
Gemma 3 4B
     ↓
Vision analysis
     ↓
Real-world challenge
     ↓
Go outside and complete it
     ↓
Take another photo
     ↓
Next challenge
```

Reality Remix also provides a persistent AI conversation for each challenge. Users can ask follow-up questions and get explanations without losing the previous conversation.

---

## Features

* Analyze real-world surroundings using a photo
* Generate challenges based only on visible objects
* Safe, short physical-world activities
* Challenge progression
* Persistent AI conversation for each challenge
* Local AI inference
* Open-weight vision model
* Ollama running in Docker
* No proprietary cloud AI API required
* Simple React + Spring Boot architecture
* Designed around getting users away from their screens

---

## Why Reality Remix?

Most AI experiences encourage people to spend more time looking at a screen.

Reality Remix explores the opposite idea:

> **Can AI help us interact with the physical world instead?**

The goal is simple:

> **Use AI to get off the screen, not stay on it.**

You take a photo, receive a challenge, put the phone down, and interact with the world around you.

---

## AI

Reality Remix uses **Gemma 3 4B** through **Ollama**.

Ollama runs inside a Docker container rather than directly on the host machine.

```text
Spring Boot Backend
        ↓
http://localhost:11434
        ↓
Ollama Docker Container
        ↓
Gemma 3 4B
        ↓
Vision analysis + challenge generation
```

The model analyzes the uploaded image and generates a challenge based on what is actually visible.

The local setup allows the core AI experience to run without sending images to a proprietary cloud AI service.

---

## Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Java 21
* Spring Boot
* Maven

### AI

* Ollama
* Gemma 3 4B
* Docker

---

## Architecture

```text
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │   localhost:5173    │
                    └──────────┬──────────┘
                               │
                               │ HTTP
                               ▼
                    ┌─────────────────────┐
                    │   Spring Boot API   │
                    │   localhost:8080    │
                    └──────────┬──────────┘
                               │
                               │ HTTP
                               ▼
                    ┌─────────────────────┐
                    │   Ollama Container  │
                    │   port 11434        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Gemma 3 4B      │
                    │   Vision Model      │
                    └─────────────────────┘
```

---

## Project Structure

```text
reality-remix/
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       └── main.jsx
│
├── scripts/
│   └── setup-ollama.sh
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/realityremix/
│   │   │       ├── RealityRemixApplication.java
│   │   │       └── controller/
│   │   │           └── RealityRemixController.java
│   │   └── resources/
│   │       └── application.properties
│   │
│   └── test/
│       └── java/
│
├── pom.xml
├── mvnw
├── mvnw.cmd
├── LICENSE
└── README.md
```

---

# Running Locally

## Requirements

Make sure you have:

* Java 21+
* Node.js 18+
* npm
* Docker
* Internet connection for downloading the Ollama image and AI model

You do **not** need to install Ollama directly on the host.

Ollama runs through Docker.

---

## 1. Clone the Repository

```bash
git clone https://github.com/chaitanya2850/Reality-Remix.git
cd Reality-Remix
```

---

## 2. Set Up Ollama

Reality Remix provides a setup script that automatically:

* Pulls the Ollama Docker image
* Creates a persistent Docker volume
* Starts the Ollama container
* Waits for Ollama to become available
* Downloads Gemma 3 4B
* Verifies the Ollama API

Run:

```bash
chmod +x scripts/setup-ollama.sh
./scripts/setup-ollama.sh
```

The script creates:

```text
Container:
hacktoberfest_ollama
```

and exposes:

```text
http://localhost:11434
```

### Verify Ollama

```bash
curl http://localhost:11434/api/tags
```

You should see `gemma3:4b` listed in the response.

---

## Manual Ollama Setup

If you prefer to set everything up manually:

### Pull the image

```bash
docker pull ollama/ollama:latest
```

### Create a persistent volume

```bash
docker volume create reality-remix-ollama
```

### Start the container

```bash
docker run -d \
  --name hacktoberfest_ollama \
  -p 11434:11434 \
  -v reality-remix-ollama:/root/.ollama \
  ollama/ollama:latest
```

### Pull Gemma 3 4B

```bash
docker exec -it hacktoberfest_ollama ollama pull gemma3:4b
```

### Check the container

```bash
docker ps
```

You should see something similar to:

```text
CONTAINER ID   IMAGE                  PORTS
...            ollama/ollama:latest  0.0.0.0:11434->11434/tcp
```

---

# 3. Start the Spring Boot Backend

From the project root:

```bash
./mvnw spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

The backend connects to Ollama using:

```properties
ollama.url=http://localhost:11434
```

---

# 4. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will normally start the frontend at:

```text
http://localhost:5173
```

Open that address in your browser.

---

# Docker Setup

The AI runtime is containerized using the official Ollama Docker image.

Example:

```text
Container:
hacktoberfest_ollama

Image:
ollama/ollama:latest

Port:
11434
```

The model is stored in a Docker volume:

```text
reality-remix-ollama
```

This means the downloaded model persists even if the Ollama container is recreated.

---

# API

## Analyze an Image

```http
POST /api/reality-remix/analyze
```

### Request

Multipart form data:

```text
image
challengeNumber
```

Example:

```bash
curl -X POST \
  http://localhost:8080/api/reality-remix/analyze \
  -F "image=@/path/to/image.jpg" \
  -F "challengeNumber=1"
```

### Response

```json
{
  "challenge": "OBJECTS:\n...\n\nCHALLENGE:\n...\n\nWHY:\n...",
  "challengeNumber": 1
}
```

---

## Chat With the Challenge Assistant

```http
POST /api/reality-remix/chat
```

Example request:

```json
{
  "challenge": "Walk along the path and find something interesting you did not notice in the photo.",
  "messages": [
    {
      "role": "user",
      "content": "What exactly do I have to do?"
    },
    {
      "role": "assistant",
      "content": "Walk along the path and look for a detail you did not notice before."
    },
    {
      "role": "user",
      "content": "Can I look at the trees?"
    }
  ]
}
```

The complete conversation is sent to the local AI model so that the assistant can maintain context throughout the challenge.

---

# Challenge Generation

Reality Remix instructs the model to:

* Identify visible objects
* Avoid inventing objects
* Create a physical-world challenge
* Keep challenges short
* Encourage movement and exploration
* Avoid dangerous activities
* Avoid climbing or damaging objects
* Avoid requiring a computer or internet
* Generate challenges based on the actual environment

The model returns:

```text
OBJECTS:
[visible objects]

CHALLENGE:
[physical-world challenge]

WHY:
[why the environment enables the challenge]
```

---

# Example Flow

Imagine the user takes a photo of a garden.

The model might identify:

```text
OBJECTS:
- Grass
- Trees
- Garden path
- Bench
```

It could generate:

```text
CHALLENGE:
Walk along the garden path and find one detail you did not notice
before taking the photo.
```

The user completes the challenge away from the screen.

They can then take another photo and generate the next challenge.

---

# Safety

Reality Remix is designed around short, low-risk physical activities.

The AI is instructed not to create challenges involving:

* Dangerous objects
* Climbing
* Damaging property
* Unsafe approaches
* Computers
* Phones
* Internet usage
* Social media

Users should still use their own judgment and avoid anything that feels unsafe.

---

# Local-First AI

The core AI processing can run locally using:

```text
Docker
   ↓
Ollama
   ↓
Gemma 3 4B
```

This avoids requiring a proprietary hosted AI API for the core vision and challenge-generation experience.

It also makes the project easier to experiment with using open-weight models.

---

# Hacktoberfest 2026

Reality Remix was created for **Hacktoberfest 2026 — Touch Grass**.

The project combines:

* Open source
* Open-weight AI
* Computer vision
* Physical-world interaction
* Local AI inference

The idea is intentionally simple:

> **AI should not always give you more things to look at. Sometimes it should tell you to look up.**

---

# Contributing

Contributions are welcome.

Some ideas for future improvements:

* More challenge types
* Challenge difficulty levels
* Better safety filtering
* Challenge streaks
* Progress tracking
* Location-aware challenges
* Additional open-weight models
* Improved accessibility
* Mobile-first improvements
* Better vision analysis
* Challenge completion detection
* More sophisticated challenge progression
* Additional Ollama models

### Contribution Flow

```bash
git clone https://github.com/chaitanya2850/Reality-Remix.git

cd Reality-Remix

git checkout -b feature/my-feature
```

Make your changes, test them locally, then commit:

```bash
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

Then open a pull request.

---

# Development

### Backend

```bash
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Ollama

```bash
./scripts/setup-ollama.sh
```

---

# License

Reality Remix is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for the complete license text.

**SPDX-License-Identifier:** `MIT`

---

## The Idea

Reality Remix is built around one question:

> **What if AI could turn whatever is around you into a game?**

Take a photo.

Get a challenge.

Put the phone down.

**Touch grass.**

