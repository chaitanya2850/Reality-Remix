import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);

  const [challengeNumber, setChallengeNumber] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  /*
   * Load conversation for the current challenge.
   */
  useEffect(() => {
    const saved = localStorage.getItem(
      `reality-remix-chat-${challengeNumber}`
    );

    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [challengeNumber]);

  /*
   * Save conversation whenever it changes.
   */
  useEffect(() => {
    localStorage.setItem(
      `reality-remix-chat-${challengeNumber}`,
      JSON.stringify(messages)
    );
  }, [messages, challengeNumber]);


  /*
   * Select image.
   */
  const handleImage = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");

    setQuestion("");
    setMessages([]);
  };


  /*
   * Analyze image.
   */
  const analyzeImage = async () => {
    if (!image) return;

    setLoading(true);
    setError("");

    const formData = new FormData();

    formData.append("image", image);
    formData.append("challengeNumber", challengeNumber);

    try {
      const response = await fetch(
        "http://localhost:8080/api/reality-remix/analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();

      setResult(data.challenge);

      /*
       * New challenge = new conversation.
       */
      setMessages([]);

      localStorage.removeItem(
        `reality-remix-chat-${challengeNumber}`
      );

    } catch {
      setError(
        "Could not connect to Reality Remix. Make sure Spring Boot is running."
      );
    } finally {
      setLoading(false);
    }
  };


  /*
   * Parse challenge.
   */
  const parseResult = () => {
    if (!result) {
      return {
        objects: "",
        challenge: "",
        why: "",
      };
    }

    const objects =
      result.match(
        /OBJECTS:\s*([\s\S]*?)\s*CHALLENGE:/
      )?.[1]?.trim() || "";

    const challenge =
      result.match(
        /CHALLENGE:\s*([\s\S]*?)\s*WHY:/
      )?.[1]?.trim() || "";

    const why =
      result.match(
        /WHY:\s*([\s\S]*)/
      )?.[1]?.trim() || "";

    return {
      objects,
      challenge,
      why,
    };
  };

  const parsed = parseResult();


  /*
   * Send message.
   */
  const sendMessage = async () => {
    const text = question.trim();

    if (
      !text ||
      !parsed.challenge ||
      chatLoading
    ) {
      return;
    }

    const userMessage = {
      role: "user",
      content: text,
    };

    const conversation = [
      ...messages,
      userMessage,
    ];

    /*
     * Immediately display user's message.
     */
    setMessages(conversation);
    setQuestion("");
    setChatLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/reality-remix/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            challenge: parsed.challenge,
            messages: conversation,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();

      const assistantMessage = {
        role: "assistant",
        content: data.answer,
      };

      setMessages([
        ...conversation,
        assistantMessage,
      ]);

    } catch {
      setMessages([
        ...conversation,
        {
          role: "assistant",
          content:
            "I couldn't respond right now. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };


  /*
   * Start next challenge.
   */
  const nextChallenge = () => {
    const nextNumber = challengeNumber + 1;

    setChallengeNumber(nextNumber);

    setImage(null);
    setPreview(null);
    setResult(null);
    setError("");

    setMessages([]);
    setQuestion("");
  };


  return (
    <main className="app">

      {/* NAVBAR */}

      <nav className="navbar">

        <div className="logo">
          <span className="logo-mark">
            R
          </span>

          <span>
            Reality Remix
          </span>
        </div>

        <div className="session">
          <span>
            CHALLENGE
          </span>

          <strong>
            #{challengeNumber}
          </strong>
        </div>

      </nav>


      {/* HERO */}

      <section className="hero">

        <p className="eyebrow">
          TOUCH GRASS
        </p>

        <h1>
          Turn your surroundings
          <br />
          into a <span>real-world challenge.</span>
        </h1>

        <p className="subtitle">
          Take a photo of what's around you.
          Reality Remix creates a short physical
          challenge from what it actually sees.
        </p>
        <p className="open-source-note">
            Open-source app · Open-weight AI · Local-first
        </p>
      </section>


      {/* WORKSPACE */}

      <section className="workspace">

        {/* UPLOAD */}

        {!preview && !result && (
          <label className="upload-box">

            <div className="upload-icon">
              +
            </div>

            <h2>
              {challengeNumber === 1
                ? "Show me your surroundings"
                : "Where are you now?"}
            </h2>

            <p>
              {challengeNumber === 1
                ? "Take a photo or choose one from your device."
                : "Take another photo to discover your next challenge."}
            </p>

            <span className="upload-button">
              {challengeNumber === 1
                ? "Choose photo"
                : "Take next photo"}
            </span>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImage}
            />

          </label>
        )}


        {/* PREVIEW */}

        {preview && !result && (
          <div className="photo-section">

            <div className="preview-card">
              <img
                src={preview}
                alt="Your surroundings"
              />
            </div>

            <div className="actions">

              <label className="secondary-button">

                Change photo

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImage}
                />

              </label>

              <button
                className="analyze-button"
                onClick={analyzeImage}
                disabled={loading}
              >
                {loading
                  ? "Creating challenge..."
                  : "Create challenge"}
              </button>

            </div>

          </div>
        )}


        {/* ERROR */}

        {error && (
          <div className="error">
            {error}
          </div>
        )}


        {/* RESULT */}

        {result && (
          <div className="result-card">

            {/* HEADER */}

            <div className="result-header">
              <span className="result-label">
                CHALLENGE #{challengeNumber}
              </span>
            </div>


            {/* CHALLENGE */}

            <div className="challenge">

              <p className="section-label">
                YOUR CHALLENGE
              </p>

              <h2>
                {parsed.challenge}
              </h2>

              <p className="challenge-hint">
                Put the phone down and go do it.
              </p>

            </div>


            {/* CHAT */}

            <div className="chat">

              <div className="chat-header">

                <div>
                  <p className="section-label">
                    REALITY REMIX
                  </p>

                  <h3>
                    Talk to your challenge
                  </h3>
                </div>

                <span className="chat-status">
                  AI
                </span>

              </div>


              {/* MESSAGE HISTORY */}

              <div className="messages">

                {messages.length === 0 && (
                  <div className="chat-welcome">

                    <p>
                      Need help?
                    </p>

                    <span>
                      Ask me anything about this challenge.
                    </span>

                  </div>
                )}


                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`message ${
                      message.role === "user"
                        ? "user-message"
                        : "assistant-message"
                    }`}
                  >

                    <span className="message-label">
                      {message.role === "user"
                        ? "YOU"
                        : "REALITY REMIX"}
                    </span>

                    <p>
                      {message.content}
                    </p>

                  </div>
                ))}


                {chatLoading && (
                  <div className="message assistant-message">

                    <span className="message-label">
                      REALITY REMIX
                    </span>

                    <div className="typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>

                  </div>
                )}

              </div>


              {/* INPUT */}

              <div className="chat-input">

                <input
                  type="text"
                  placeholder="Ask about your challenge..."
                  value={question}
                  onChange={(event) =>
                    setQuestion(event.target.value)
                  }
                  onKeyDown={(event) => {

                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      sendMessage();
                    }

                  }}
                  disabled={chatLoading}
                />

                <button
                  onClick={sendMessage}
                  disabled={
                    chatLoading ||
                    !question.trim()
                  }
                >
                  Send
                </button>

              </div>

              <p className="chat-note">
                Your conversation stays with this challenge.
              </p>

            </div>


            {/* DETAILS */}

            <div className="details">

              <div>

                <p className="section-label">
                  WHAT AI SAW
                </p>

                <p>
                  {parsed.objects}
                </p>

              </div>

              <div>

                <p className="section-label">
                  WHY THIS WORKS
                </p>

                <p>
                  {parsed.why}
                </p>

              </div>

            </div>


            {/* NEXT */}

            <button
              className="next-button"
              onClick={nextChallenge}
            >

              <span>
                I've done it
              </span>

              <strong>
                Next challenge →
              </strong>

            </button>

          </div>
        )}

      </section>


      <footer>
        Reality Remix · Open-weight AI · Built for Touch Grass
      </footer>

    </main>
  );
}

export default App;

