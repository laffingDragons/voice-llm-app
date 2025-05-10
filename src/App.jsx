import { useState, useEffect } from "react";
import { OpenAI } from "openai";
import { Mic, Send } from "lucide-react";

function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isApiKeyValid, setIsApiKeyValid] = useState(null);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");

  // Initialize Web Speech API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  }

  // Start/stop listening
  const toggleListening = () => {
    if (!recognition) {
      setShowTextInput(true);
      setError("Speech recognition not supported. Use text input.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setError("");
      recognition.start();
      setIsListening(true);
    }
  };

  // Handle speech recognition results
  useEffect(() => {
    if (recognition) {
      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        if (isApiKeyValid) {
          fetchLLMResponse(text);
        }
      };

      recognition.onerror = () => {
        setError("Speech recognition failed. Try again or use text input.");
        setIsListening(false);
        setShowTextInput(true);
      };
    }
  }, [recognition, isApiKeyValid]);

  // Validate API key
  const validateApiKey = async (key) => {
    try {
      const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
      await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 10,
      });
      setIsApiKeyValid(true);
      setError("");
    } catch (err) {
      setIsApiKeyValid(false);
      setError("Invalid API key. Please check and try again.");
    }
  };

  // Handle API key input
  const handleApiKeyChange = (e) => {
    const key = e.target.value;
    setApiKey(key);
    if (key) {
      validateApiKey(key);
    } else {
      setIsApiKeyValid(null);
      setError("");
    }
  };

  // Fetch LLM response
  const fetchLLMResponse = async (input) => {
    if (!isApiKeyValid) {
      setError("Please provide a valid API key.");
      return;
    }

    try {
      setError("");
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: input }],
        max_tokens: 150,
      });
      const responseText = completion.choices[0].message.content;
      setResponse(responseText);
      // Restart mic after 1 second
      setTimeout(() => {
        if (recognition) {
          recognition.start();
          setIsListening(true);
        }
      }, 1000);
    } catch (err) {
      setError("Failed to fetch response. Check your API key or try again.");
    }
  };

  // Handle text input submission
  const handleTextSubmit = () => {
    if (textInput) {
      setTranscript(textInput);
      if (isApiKeyValid) {
        fetchLLMResponse(textInput);
      }
      setTextInput("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 p-4">
      <h1 className="text-4xl font-bold text-white mb-6 animate-pulse">Voice LLM App</h1>

      {/* API Key Input */}
      <div className="w-full max-w-md mb-4">
        <input
          type="text"
          placeholder="Enter OpenAI API Key"
          value={apiKey}
          onChange={handleApiKeyChange}
          className="w-full p-2 rounded-lg bg-white/80 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        {isApiKeyValid === false && <p className="text-red-300 mt-1">{error}</p>}
        {isApiKeyValid === true && <p className="text-green-300 mt-1">API key valid!</p>}
      </div>

      {/* Microphone Button */}
      <button
        onClick={toggleListening}
        className={`p-4 rounded-full bg-white/80 hover:bg-white transition-all duration-300 ${
          isListening ? "animate-glow shadow-lg shadow-yellow-400" : ""
        }`}
      >
        <Mic className={`w-8 h-8 ${isListening ? "text-red-500" : "text-gray-800"}`} />
      </button>

      {/* Warning if no API key */}
      {!isApiKeyValid && (
        <p className="text-yellow-300 mt-2">You can test the mic, but enter an API key for LLM responses.</p>
      )}

      {/* Text Input Fallback */}
      {showTextInput && (
        <div className="w-full max-w-md mt-4 flex">
          <input
            type="text"
            placeholder="Type your input here"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="flex-1 p-2 rounded-l-lg bg-white/80 text-gray-800 focus:outline-none"
          />
          <button
            onClick={handleTextSubmit}
            className="p-2 bg-yellow-400 rounded-r-lg hover:bg-yellow-500"
          >
            <Send className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      {/* Chat Display */}
      <div className="w-full max-w-md mt-6">
        {transcript && (
          <div className="p-3 mb-2 rounded-lg bg-white/80 text-gray-800">
            <strong>You:</strong> {transcript}
          </div>
        )}
        {response && (
          <div className="p-3 rounded-lg bg-yellow-400/80 text-white">
            <strong>LLM:</strong> {response}
          </div>
        )}
        {error && !isApiKeyValid && !showTextInput && (
          <p className="text-red-300">{error}</p>
        )}
      </div>
    </div>
  );
}

export default App;