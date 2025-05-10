import { useState, useEffect, useRef } from "react";
import { OpenAI } from "openai";
import { Mic, Send, Menu, Trash2, MicOff } from "lucide-react";
import CryptoJS from "crypto-js";
import toast, { Toaster } from "react-hot-toast";

function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isApiKeyValid, setIsApiKeyValid] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isPreRestart, setIsPreRestart] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const chatContainerRef = useRef(null);
  const textInputRef = useRef(null);

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
          toast.error("🔐 Key's playing hide & seek! Feed me a new one, pretty please! 🙏✨");
        }
      } catch (err) {
        toast.error("🤯 Key decryption flopped! Time for a fresh one, chief! 🔑");
      }
    }

    // Load chat history
    const savedHistory = localStorage.getItem("chatHistory");
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save chat history to localStorage (limit to latest 10 chats)
  useEffect(() => {
    if (chatHistory.length > 0) {
      const limitedHistory = chatHistory.slice(-10); // Keep latest 10 chats
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
      setError("Oopsie daisy! Your mic's having a spa day! 🧖‍♀️ Give typing a whirl or try Chrome - it's the mic whisperer! 😜");
      toast.error("🎙️ Mic's MIA! No worries - keyboard warriors unite! ⌨️💪");
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
        setError("Mic malfunction detected! 🚨 Emergency keyboard mode activated! 🚀");
        toast.error("🎪 Mic pulled a vanishing act! Time to flex those typing fingers! 🤹‍♂️");
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
      setError("🕵️ Key's acting sus! OpenAI says 'Nope!' Give me the good stuff! 🦾");
      toast.error("🚫 Key rejected! Time to sweet-talk OpenAI for a real one! 😏");
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
      localStorage.removeItem("encryptedApiKey");
    }
  };

  // Estimate tokens
  const estimateTokens = (text) => {
    return Math.ceil(text.split(/\s+/).length / 0.75);
  };

  // Fetch LLM response
  const fetchLLMResponse = async (input) => {
    if (!isApiKeyValid) {
      setError("🤖 AI's throwing a tantrum! Feed it an API key and watch the magic happen! ✨");
      toast.error("🎭 No key, no play! AI demands its GPT-3.5 Turbo goodness! 🍭");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      
      // Prepare messages with latest 5 chats as context
      const limitedHistory = chatHistory.slice(-5);
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
      const newChat = {
        input,
        response: responseText,
        timestamp: new Date().toISOString()
      };
      
      setChatHistory((prev) => [...prev, newChat]);
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
      setError("🧠❄️ AI brain freeze alert! Key malfunction or server's sulking? 🤷‍♂️");
      toast.error("💥 Uh oh! AI's having a moment. Key check or retry dance? 💃");
      setIsLoading(false);
    }
  };

  // Handle text input submission
  const handleTextSubmit = () => {
    if (textInput.trim()) {
      setTranscript(textInput);
      if (isApiKeyValid) {
        fetchLLMResponse(textInput);
      }
      setTextInput("");
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTextSubmit();
    }
  };

  // Clear chat history
  const clearChatHistory = () => {
    setChatHistory([]);
    localStorage.removeItem("chatHistory");
    toast.success("🧹 Poof! Clean slate activated! Let's start fresh, buddy! 🎉✨");
  };

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  // Focus text input when shown
  useEffect(() => {
    if (showTextInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [showTextInput]);

  // Determine if chat should be shown
  const showChat = chatHistory.length > 0 || isLoading;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 animate-gradient overflow-hidden">
      {/* Custom CSS for additional animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
        @keyframes glow {
          0% { box-shadow: 0 0 20px rgba(255, 0, 255, 0.4), 0 0 30px rgba(0, 255, 255, 0.3); }
          50% { box-shadow: 0 0 40px rgba(255, 0, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.6); }
          100% { box-shadow: 0 0 20px rgba(255, 0, 255, 0.4), 0 0 30px rgba(0, 255, 255, 0.3); }
        }
        .animate-glow {
          animation: glow 1.5s ease-in-out infinite;
        }
        @keyframes bounce-dot {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-dot1 { animation: bounce-dot 0.6s infinite; }
        .animate-bounce-dot2 { animation: bounce-dot 0.6s infinite 0.2s; }
        .animate-bounce-dot3 { animation: bounce-dot 0.6s infinite 0.4s; }
        @keyframes slide-up {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
        @keyframes pulse-pre-restart {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(251, 146, 60, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 146, 60, 0); }
        }
        .animate-pulse-pre-restart {
          animation: pulse-pre-restart 1s ease-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-in;
        }
      `}</style>

      {/* Toaster for notifications */}
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { 
            background: "linear-gradient(45deg, #FF6B6B, #4ECDC4)", 
            color: "#fff",
            borderRadius: "15px",
            padding: "12px 20px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          },
          success: {
            iconTheme: {
              primary: '#fff',
              secondary: '#4ECDC4',
            }
          },
          error: {
            iconTheme: {
              primary: '#fff',
              secondary: '#FF6B6B',
            }
          }
        }} 
      />

      {/* Sidebar - Completely Hidden When Closed */}
      <div
        className={`sidebar fixed inset-y-0 left-0 z-20 bg-gradient-to-b from-indigo-600/50 to-purple-600/50 backdrop-blur-xl border-r border-cyan-400/40 transition-all duration-500 ease-out transform ${
          isSidebarOpen ? "w-full md:w-80 translate-x-0" : "w-0 -translate-x-full"
        } ${isApiKeyValid ? "animate-pulse-border" : ""}`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-4 ${isSidebarOpen ? 'left-4' : 'left-4'} p-3 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full hover:from-pink-600 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-pink-500/25 ${
            !isSidebarOpen ? 'fixed z-30' : ''
          }`}
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
        
        {isSidebarOpen && (
          <div className="p-6 mt-16">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-300 mb-6">
              🚀 GPT-3.5 Turbo Key 🚀
            </h2>
            <input
              type="password"
              placeholder="Drop your magic key here! ✨"
              value={apiKey}
              onChange={handleApiKeyChange}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-indigo-900/50 to-purple-900/50 backdrop-blur-sm text-cyan-200 placeholder-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-pink-400/70 border border-cyan-400/20 transition-all duration-300"
            />
            {isApiKeyValid === false && <p className="text-pink-400 mt-2 text-sm animate-pulse">{error}</p>}
            {isApiKeyValid === true && (
              <p className="text-green-400 mt-2 text-sm font-semibold animate-bounce">🎯 Boom! We're locked and loaded! 🎉</p>
            )}
            {!isApiKeyValid && (
              <p className="text-yellow-300 mt-3 text-xs">
                No key? No worries! Just feed me some OpenAI magic and we're good to go! 😎
              </p>
            )}
            
            {/* Clear Chat Button */}
            {chatHistory.length > 0 && (
              <button
                onClick={clearChatHistory}
                className="mt-8 w-full p-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-red-500/25"
              >
                <Trash2 className="w-5 h-5" />
                🧹 Sweep it clean!
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`main-content flex-1 flex flex-col transition-all duration-500 relative ${
        isSidebarOpen ? "md:ml-80" : "md:ml-0"
      }`}>
        
        {!showChat && (
          // Landing Screen
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-300 to-yellow-300 mb-6 animate-pulse md:text-7xl text-center tracking-wider drop-shadow-lg">
              🎤 Talk & Chat! 🤖
            </h1>
            <p className="text-center animate-fade-in max-w-lg text-lg">
              <span className="text-yellow-300">Hey there, chatterbox! 👋</span>{" "}
              <span className="text-pink-300">Hit that groovy mic button 🔥</span>{" "}
              <span className="text-cyan-300">or type away like a boss! 💪</span>
            </p>
          </div>
        )}

        {showChat && (
          // Chat Interface (Full Screen)
          <div className="flex-1 flex flex-col h-screen">
            {/* Chat Display */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-black/5 to-black/10 backdrop-blur-sm"
            >
              <div className="max-w-4xl mx-auto">
                {chatHistory.map((chat, index) => (
                  <div key={index} className="animate-slide-up mb-6 transform">
                    <div className="flex justify-end mb-3">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white max-w-[80%] backdrop-blur-sm shadow-lg hover:shadow-blue-500/20 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"></div>
                        <div className="relative z-10">{chat.input}</div>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 text-white max-w-[80%] backdrop-blur-sm shadow-lg hover:shadow-pink-500/20 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"></div>
                        <div className="relative z-10">{chat.response}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                      <div className="flex items-center gap-2">
                        <span className="animate-pulse">🤔</span>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce-dot1"></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce-dot2"></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce-dot3"></div>
                        </div>
                        <span className="text-sm opacity-80">Thinking of something witty...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Microphone Button - Colorful with glow effect */}
        <button
          onClick={toggleListening}
          className={`fixed bottom-24 right-6 md:bottom-8 md:right-8 p-5 rounded-full transition-all duration-300 z-30 transform hover:scale-110 ${
            isListening
              ? "bg-gradient-to-r from-red-500 to-pink-500 animate-glow shadow-lg shadow-red-500/70 ring-4 ring-red-400/30"
              : isPreRestart
              ? "bg-gradient-to-r from-orange-500 to-yellow-500 animate-pulse-pre-restart shadow-lg shadow-orange-500/70 ring-4 ring-orange-400/30"
              : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-xl shadow-cyan-500/50 ring-4 ring-cyan-400/20"
          }`}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 text-white drop-shadow-lg" />
          ) : (
            <Mic className={`w-8 h-8 text-white drop-shadow-lg`} />
          )}
        </button>

        {/* Text Input - Always at bottom */}
        <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 backdrop-blur-xl p-6 border-t border-cyan-400/20">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              ref={textInputRef}
              type="text"
              placeholder="Whatcha wanna say? Drop it like it's hot! 🔥"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 p-4 rounded-2xl bg-gradient-to-r from-indigo-600/40 to-purple-600/40 backdrop-blur-sm text-cyan-100 placeholder-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-pink-400/70 border border-cyan-400/30 transition-all duration-300 text-lg"
            />
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className={`p-4 rounded-2xl transition-all duration-300 shadow-lg ${
                textInput.trim() 
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-green-500/30" 
                  : "bg-gray-500/50 text-gray-300 cursor-not-allowed"
              }`}
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;