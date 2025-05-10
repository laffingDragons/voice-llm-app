import { useState, useEffect, useRef } from "react";
import { OpenAI } from "openai";
import { Mic, Send, Menu } from "lucide-react";
import CryptoJS from "crypto-js";
import toast, { Toaster } from "react-hot-toast";

function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isApiKeyValid, setIsApiKeyValid] = useState(null);
  const [chatHistory, setChatHistory] = useState([]); // Persistent chat history
  const [error, setError] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isPreRestart, setIsPreRestart] = useState(false); // For mic restart animation
  const [isLoading, setIsLoading] = useState(false); // For streaming load
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For collapsible sidebar
  const chatContainerRef = useRef(null); // For auto-scroll

  // Encryption key (hardcoded for simplicity; not secure for production)
  const ENCRYPTION_KEY = "voice-llm-app-secret";

  // Load API key and chat history from localStorage
  useEffect(() => {
    // Load encrypted API key
    const encryptedKey = localStorage.getItem("encryptedApiKey");
    if (encryptedKey) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
        const decryptedKey = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedKey) {
          setApiKey(decryptedKey);
          validateApiKey(decryptedKey);
        } else {
          toast.error("Uh-oh, your key’s locked in a mystery box! Enter a new one to save the day! 🔒");
        }
      } catch (err) {
        toast.error("Uh-oh, your key’s locked in a mystery box! Enter a new one to save the day! 🔒");
      }
    }

    // Load chat history
    const savedHistory = localStorage.getItem("chatHistory");
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save chat history to localStorage (limit to latest 5 chats)
  useEffect(() => {
    if (chatHistory.length > 0) {
      const limitedHistory = chatHistory.slice(-5); // Keep latest 5 chats
      localStorage.setItem("chatHistory", JSON.stringify(limitedHistory));
    }
  }, [chatHistory]);

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
      setError("Whoops, your mic’s on a coffee break! Try again or type it out. Chrome loves mics! ☕");
      toast.error("Whoops, your mic’s on a coffee break! Try again or type it out. Chrome loves mics! ☕");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      setIsPreRestart(false);
    } else {
      setError("");
      recognition.start();
      setIsListening(true);
      setIsPreRestart(false);
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
        setError("Whoops, your mic’s on a coffee break! Try again or type it out. Chrome loves mics! ☕");
        toast.error("Whoops, your mic’s on a coffee break! Try again or type it out. Chrome loves mics! ☕");
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
      // Encrypt and save to localStorage
      const encryptedKey = CryptoJS.AES.encrypt(key, ENCRYPTION_KEY).toString();
      localStorage.setItem("encryptedApiKey", encryptedKey);
    } catch (err) {
      setIsApiKeyValid(false);
      setError("Yikes! Your API key is playing hide-and-seek! Grab a valid one from OpenAI! 🕵️");
      toast.error("Yikes! Your API key is playing hide-and-seek! Grab a valid one from OpenAI! 🕵️");
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
      localStorage.removeItem("encryptedApiKey"); // Clear if empty
    }
  };

  // Estimate tokens (simple word-based approximation)
  const estimateTokens = (text) => {
    return Math.ceil(text.split(/\s+/).length / 0.75); // Rough estimate: 1 token ~ 0.75 words
  };

  // Fetch LLM response
  const fetchLLMResponse = async (input) => {
    if (!isApiKeyValid) {
      setError("Hey, the AI’s waiting for its VIP pass! Pop in a GPT-3.5 Turbo API key! 🎟️");
      toast.error("Hey, the AI’s waiting for its VIP pass! Pop in a GPT-3.5 Turbo API key! 🎟️");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      // Prepare messages with latest 5 chats as context
      const limitedHistory = chatHistory.slice(-5); // Limit to 5 chats
      const messages = limitedHistory
        .flatMap((chat) => [
          { role: "user", content: chat.input },
          { role: "assistant", content: chat.response },
        ])
        .concat([{ role: "user", content: input }]);
      // Estimate total tokens
      const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
      if (totalTokens > 1000) {
        // Trim to last 3 chats if token limit exceeded
        const trimmedHistory = limitedHistory.slice(-3);
        messages.splice(0, messages.length, ...trimmedHistory.flatMap((chat) => [
          { role: "user", content: chat.input },
          { role: "assistant", content: chat.response },
        ]).concat([{ role: "user", content: input }]));
      }
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 150,
      });
      const responseText = completion.choices[0].message.content;
      setChatHistory((prev) => [...prev, { input, response: responseText }]);
      setIsLoading(false);
      // Start pre-restart phase
      setIsPreRestart(true);
      setTimeout(() => {
        if (recognition && !isListening) {
          recognition.start();
          setIsListening(true);
          setIsPreRestart(false);
        }
      }, 2000);
    } catch (err) {
      setError("Oh no, the AI’s having a brain freeze! Check your key or try again later! 🥶");
      toast.error("Oh no, the AI’s having a brain freeze! Check your key or try again later! 🥶");
      setIsLoading(false);
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

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 animate-gradient">
      {/* Toaster for notifications */}
      <Toaster position="top-right" toastOptions={{ style: { background: "#fff", color: "#333" } }} />

      {/* Fullscreen Sidebar */}
      <div
        className={`sidebar fixed inset-y-0 left-0 z-10 bg-gray-900/90 border-r border-yellow-400/50 transition-all duration-300 ${
          isSidebarOpen ? "w-full md:w-80" : "w-16"
        } ${isApiKeyValid ? "animate-pulse-border" : ""}`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 p-2 bg-white/80 rounded-lg"
        >
          <Menu className="w-6 h-6 text-gray-800" />
        </button>
        {isSidebarOpen && (
          <div className="p-4 mt-12">
            <h2 className="text-2xl font-bold text-white mb-4">GPT-3.5 Turbo API Key</h2>
            <input
              type="text"
              placeholder="Paste your key here!"
              value={apiKey}
              onChange={handleApiKeyChange}
              className="w-full p-2 rounded-lg bg-white/80 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {isApiKeyValid === false && <p className="text-red-300 mt-1">{error}</p>}
            {isApiKeyValid === true && (
              <p className="text-green-300 mt-1">Woohoo! Your key’s ready to rock! 🎉</p>
            )}
            {!isApiKeyValid && (
              <p className="text-yellow-300 mt-2 text-sm">
                No key? You can still play with the mic, but the AI’s shy without its pass! 😜
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`main-content flex-1 flex flex-col items-center justify-center p-4 ${isSidebarOpen ? "md:ml-80" : "md:ml-16"}`}>
        <h1 className="text-4xl font-bold text-white mb-6 animate-pulse md:text-5xl">
          Voice LLM App
        </h1>

        {/* Microphone Button */}
        <button
          onClick={toggleListening}
          className={`fixed top-4 right-4 md:top-auto md:right-auto p-4 rounded-full bg-white/80 transition-all duration-300 ${
            isListening
              ? "w-10 h-10 animate-glow shadow-lg shadow-yellow-400"
              : isPreRestart
              ? "w-16 h-16 animate-pulse-pre-restart shadow-md shadow-orange-400"
              : "w-16 h-16 hover:scale-105"
          }`}
        >
          <Mic
            className={`w-6 h-6 md:w-8 md:h-8 ${
              isListening ? "text-red-500" : isPreRestart ? "text-orange-500" : "text-gray-800"
            }`}
          />
        </button>

        {/* Permission Note */}
        <p className="text-yellow-300 mt-2 text-sm animate-fade-in">
          Psst! Give mic permissions for voice magic to work. Chrome’s your best buddy for this! 😎
        </p>

        {/* Text Input Fallback */}
        {showTextInput && (
          <div className="w-full max-w-md mt-4 flex">
            <input
              type="text"
              placeholder="Type your input here"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="flex-1 p-2 rounded-l-lg bg-white/80 text-gray-800 focus:outline-none text-sm sm:text-base"
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
        <div
          ref={chatContainerRef}
          className={`w-full max-w-md mt-6 overflow-y-auto bg-white/10 backdrop-blur-md p-4 rounded-lg ${
            isListening ? "h-[80vh]" : "h-64"
          }`}
        >
          {chatHistory.map((chat, index) => (
            <div key={index} className="animate-slide-up">
              <div className="p-3 mb-2 rounded-lg bg-white/80 text-gray-800">
                <strong>You:</strong> {chat.input}
              </div>
              <div className="p-3 mb-2 rounded-lg bg-yellow-400/80 text-white">
                <strong>LLM:</strong> {chat.response}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center mt-2">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce-dot1"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce-dot2"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce-dot3"></div>
              </div>
            </div>
          )}
          {error && !isApiKeyValid && !showTextInput && (
            <p className="text-red-300 text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;