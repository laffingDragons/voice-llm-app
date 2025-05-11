import { useState, useEffect, useRef } from "react";
import { OpenAI } from "openai";
import { Mic, Send, Menu, Trash2, MicOff, Palette } from "lucide-react";
import CryptoJS from "crypto-js";
import toast, { Toaster } from "react-hot-toast";
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
// Color themes with 10 additional pastel themes + new corporate theme
const themes = [
  {
    id: 'monochrome',
    name: '⚪ Monochrome',
    bg: 'from-gray-200 to-gray-300',
    sidebar: 'from-gray-400/60 to-gray-500/60',
    userMsg: 'from-gray-600 to-gray-700',
    aiMsg: 'from-gray-800 to-black',
    micActive: 'from-red-500 to-red-600',
    micIdle: 'from-gray-500 to-gray-600',
    input: 'from-gray-300/50 to-gray-400/50',
    accent: 'gray-900'
  },
  {
    id: 'material',
    name: '📐 Material Design',
    bg: 'from-blue-50 to-gray-100',
    sidebar: 'from-blue-600/60 to-gray-600/60',
    userMsg: 'from-blue-500 to-blue-600',
    aiMsg: 'from-gray-500 to-gray-600',
    micActive: 'from-red-500 to-red-600',
    micIdle: 'from-blue-500 to-blue-600',
    input: 'from-blue-100/50 to-gray-200/50',
    accent: 'blue-700'
  },
  {
    id: 'corporate',
    name: '🏢 Corporate Elegance',
    bg: 'from-gray-800 via-gray-900 to-blue-900',
    sidebar: 'from-gray-700/60 to-blue-800/60',
    userMsg: 'from-blue-600 to-blue-700',
    aiMsg: 'from-gray-600 to-gray-700',
    micActive: 'from-red-500 to-red-600',
    micIdle: 'from-blue-500 to-blue-600',
    input: 'from-gray-800/50 to-blue-800/50',
    accent: 'yellow-400'
  },
  {
    id: 'neon',
    name: '🌟 Neon Dreams',
    bg: 'from-purple-600 via-pink-500 to-blue-600',
    sidebar: 'from-indigo-600/50 to-purple-600/50',
    userMsg: 'from-blue-500 to-cyan-500',
    aiMsg: 'from-pink-500 to-orange-500',
    micActive: 'from-red-500 to-pink-500',
    micIdle: 'from-cyan-500 to-blue-500',
    input: 'from-indigo-600/40 to-purple-600/40',
    accent: 'pink-400'
  },
  {
    id: 'ocean',
    name: '🌊 Ocean Breeze',
    bg: 'from-blue-600 via-teal-500 to-cyan-600',
    sidebar: 'from-blue-700/50 to-teal-700/50',
    userMsg: 'from-blue-600 to-teal-500',
    aiMsg: 'from-teal-500 to-cyan-500',
    micActive: 'from-red-500 to-orange-500',
    micIdle: 'from-blue-600 to-cyan-500',
    input: 'from-blue-800/40 to-teal-800/40',
    accent: 'cyan-400'
  },
  {
    id: 'sunset',
    name: '🌅 Sunset Glow',
    bg: 'from-orange-500 via-red-500 to-pink-600',
    sidebar: 'from-orange-600/50 to-red-600/50',
    userMsg: 'from-orange-600 to-red-500',
    aiMsg: 'from-red-500 to-pink-500',
    micActive: 'from-red-600 to-pink-600',
    micIdle: 'from-orange-500 to-yellow-500',
    input: 'from-orange-800/40 to-red-800/40',
    accent: 'yellow-400'
  },
  {
    id: 'forest',
    name: '🌲 Forest Mystery',
    bg: 'from-green-700 via-emerald-600 to-teal-700',
    sidebar: 'from-green-800/50 to-emerald-800/50',
    userMsg: 'from-green-600 to-emerald-500',
    aiMsg: 'from-emerald-500 to-teal-500',
    micActive: 'from-red-500 to-orange-500',
    micIdle: 'from-green-600 to-teal-500',
    input: 'from-green-900/40 to-emerald-900/40',
    accent: 'emerald-400'
  },
  {
    id: 'cosmic',
    name: '🌌 Cosmic Night',
    bg: 'from-indigo-900 via-purple-900 to-black',
    sidebar: 'from-indigo-900/50 to-purple-900/50',
    userMsg: 'from-indigo-600 to-purple-600',
    aiMsg: 'from-purple-600 to-pink-600',
    micActive: 'from-red-600 to-pink-600',
    micIdle: 'from-indigo-500 to-purple-500',
    input: 'from-indigo-900/60 to-purple-900/60',
    accent: 'purple-400'
  },
  {
    id: 'desert',
    name: '🏜️ Desert Sand',
    bg: 'from-amber-700 via-orange-600 to-red-700',
    sidebar: 'from-amber-800/50 to-orange-800/50',
    userMsg: 'from-amber-600 to-orange-600',
    aiMsg: 'from-orange-600 to-red-600',
    micActive: 'from-red-600 to-pink-600',
    micIdle: 'from-amber-600 to-orange-600',
    input: 'from-amber-900/40 to-orange-900/40',
    accent: 'amber-400'
  },
  {
    id: 'arctic',
    name: '❄️ Arctic Frost',
    bg: 'from-blue-200 via-cyan-300 to-slate-400',
    sidebar: 'from-blue-400/50 to-cyan-500/50',
    userMsg: 'from-blue-500 to-cyan-600',
    aiMsg: 'from-cyan-600 to-slate-600',
    micActive: 'from-red-500 to-pink-500',
    micIdle: 'from-blue-500 to-cyan-600',
    input: 'from-blue-600/40 to-cyan-700/40',
    accent: 'cyan-300'
  },
  {
    id: 'rainbow',
    name: '🌈 Rainbow Blast',
    bg: 'from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
    sidebar: 'from-red-600/50 to-purple-600/50',
    userMsg: 'from-blue-600 to-green-600',
    aiMsg: 'from-yellow-600 to-red-600',
    micActive: 'from-red-600 to-pink-600',
    micIdle: 'from-blue-600 to-green-600',
    input: 'from-blue-800/40 to-purple-800/40',
    accent: 'yellow-400'
  },
  {
    id: 'cherry',
    name: '🍒 Cherry Blossom',
    bg: 'from-pink-400 via-rose-400 to-red-400',
    sidebar: 'from-pink-600/50 to-rose-600/50',
    userMsg: 'from-pink-600 to-rose-600',
    aiMsg: 'from-rose-600 to-red-600',
    micActive: 'from-red-600 to-pink-600',
    micIdle: 'from-pink-600 to-rose-600',
    input: 'from-pink-800/40 to-rose-800/40',
    accent: 'rose-400'
  },
  {
    id: 'cyberpunk',
    name: '🤖 Cyberpunk',
    bg: 'from-black via-yellow-600 to-purple-900',
    sidebar: 'from-gray-900/80 to-purple-900/80',
    userMsg: 'from-yellow-600 to-green-600',
    aiMsg: 'from-purple-600 to-pink-600',
    micActive: 'from-red-600 to-yellow-600',
    micIdle: 'from-yellow-600 to-green-600',
    input: 'from-gray-900/60 to-purple-900/60',
    accent: 'yellow-400'
  },
  {
    id: 'pastel-dream',
    name: '☁️ Pastel Dream',
    bg: 'from-pink-200 via-purple-200 to-blue-200',
    sidebar: 'from-pink-300/60 to-blue-300/60',
    userMsg: 'from-blue-300 to-purple-300',
    aiMsg: 'from-pink-300 to-rose-300',
    micActive: 'from-red-400 to-pink-400',
    micIdle: 'from-blue-400 to-cyan-400',
    input: 'from-blue-400/30 to-purple-400/30',
    accent: 'pink-300'
  },
  {
    id: 'lavender',
    name: '💜 Lavender Fields',
    bg: 'from-purple-200 via-lavender-300 to-indigo-200',
    sidebar: 'from-purple-300/60 to-indigo-300/60',
    userMsg: 'from-indigo-300 to-purple-300',
    aiMsg: 'from-lavender-400 to-violet-300',
    micActive: 'from-red-400 to-pink-400',
    micIdle: 'from-violet-400 to-purple-400',
    input: 'from-purple-400/30 to-indigo-400/30',
    accent: 'purple-300'
  },
  {
    id: 'mint',
    name: '🌿 Mint Fresh',
    bg: 'from-green-200 via-mint-300 to-teal-200',
    sidebar: 'from-green-300/60 to-teal-300/60',
    userMsg: 'from-teal-300 to-green-300',
    aiMsg: 'from-mint-400 to-emerald-300',
    micActive: 'from-red-400 to-orange-400',
    micIdle: 'from-emerald-400 to-teal-400',
    input: 'from-green-400/30 to-teal-400/30',
    accent: 'green-300'
  },
  {
    id: 'peach',
    name: '🍑 Peach Blush',
    bg: 'from-orange-200 via-peach-300 to-pink-200',
    sidebar: 'from-orange-300/60 to-pink-300/60',
    userMsg: 'from-pink-300 to-rose-300',
    aiMsg: 'from-peach-400 to-coral-300',
    micActive: 'from-red-400 to-rose-400',
    micIdle: 'from-coral-400 to-orange-400',
    input: 'from-orange-400/30 to-pink-400/30',
    accent: 'orange-300'
  },
  {
    id: 'sky',
    name: '☁️ Sky Blue',
    bg: 'from-blue-200 via-sky-300 to-cyan-200',
    sidebar: 'from-blue-300/60 to-cyan-300/60',
    userMsg: 'from-cyan-300 to-sky-300',
    aiMsg: 'from-sky-400 to-blue-300',
    micActive: 'from-red-400 to-pink-400',
    micIdle: 'from-sky-400 to-cyan-400',
    input: 'from-blue-400/30 to-cyan-400/30',
    accent: 'blue-300'
  },
  {
    id: 'butter',
    name: '🧈 Butter Cream',
    bg: 'from-yellow-200 via-amber-200 to-orange-200',
    sidebar: 'from-yellow-300/60 to-orange-300/60',
    userMsg: 'from-orange-300 to-amber-300',
    aiMsg: 'from-yellow-400 to-gold-300',
    micActive: 'from-red-400 to-orange-400',
    micIdle: 'from-amber-400 to-yellow-400',
    input: 'from-yellow-400/30 to-orange-400/30',
    accent: 'yellow-300'
  },
  {
    id: 'blush',
    name: '🌸 Rose Blush',
    bg: 'from-rose-200 via-pink-200 to-red-200',
    sidebar: 'from-rose-300/60 to-red-300/60',
    userMsg: 'from-red-300 to-rose-300',
    aiMsg: 'from-pink-400 to-blush-300',
    micActive: 'from-red-400 to-pink-400',
    micIdle: 'from-rose-400 to-pink-400',
    input: 'from-rose-400/30 to-pink-400/30',
    accent: 'rose-300'
  },
  {
    id: 'cloud',
    name: '☁️ Cloudy Day',
    bg: 'from-gray-200 via-slate-200 to-blue-gray-200',
    sidebar: 'from-gray-300/60 to-slate-300/60',
    userMsg: 'from-slate-300 to-blue-gray-300',
    aiMsg: 'from-gray-400 to-zinc-300',
    micActive: 'from-red-400 to-pink-400',
    micIdle: 'from-blue-gray-400 to-slate-400',
    input: 'from-gray-400/30 to-slate-400/30',
    accent: 'gray-300'
  },
  {
    id: 'vanilla',
    name: '🍨 Vanilla Ice',
    bg: 'from-amber-100 via-yellow-100 to-orange-100',
    sidebar: 'from-amber-200/60 to-orange-200/60',
    userMsg: 'from-orange-200 to-amber-200',
    aiMsg: 'from-yellow-300 to-cream-200',
    micActive: 'from-red-400 to-orange-400',
    micIdle: 'from-amber-300 to-yellow-300',
    input: 'from-amber-300/30 to-orange-300/30',
    accent: 'amber-200'
  },
  {
    id: 'lilac',
    name: '🌺 Lilac Garden',
    bg: 'from-purple-100 via-violet-200 to-pink-100',
    sidebar: 'from-purple-200/60 to-pink-200/60',
    userMsg: 'from-pink-200 to-lavender-200',
    aiMsg: 'from-violet-300 to-lilac-200',
    micActive: 'from-red-400 to-pink-400',
    micIdle: 'from-violet-300 to-purple-300',
    input: 'from-purple-300/30 to-pink-300/30',
    accent: 'purple-200'
  },
];

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
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [showThemes, setShowThemes] = useState(false);
  
  const chatContainerRef = useRef(null);
  const textInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Encryption key
  const ENCRYPTION_KEY = "voice-llm-app-secret";

  // Load saved data
  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem("selectedTheme");
    if (savedTheme) {
      const theme = themes.find(t => t.id === savedTheme);
      if (theme) setSelectedTheme(theme);
    }

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
    } else {
      toast.error("🚀 No API key found! Add one in the sidebar to start chatting! ✨", {
        duration: 5000,
      });
    }

    // Load chat history
    const savedHistory = localStorage.getItem("chatHistory");
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save chat history
  useEffect(() => {
    if (chatHistory.length > 0) {
      const limitedHistory = chatHistory.slice(-10); // Keep latest 10 chats
      localStorage.setItem("chatHistory", JSON.stringify(limitedHistory));
    }
  }, [chatHistory]);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.continuous = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setIsPreRestart(false);
      };

      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        if (isApiKeyValid) {
          fetchLLMResponse(text);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError("Mic malfunction detected! 🚨 Emergency keyboard mode activated! 🚀");
        toast.error("🎪 Mic pulled a vanishing act! Time to flex those typing fingers! 🤹‍♂️");
        setIsListening(false);
        setShowTextInput(true);
      };
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isApiKeyValid]);

  // Mic control with better state management
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setShowTextInput(true);
      setError("Oopsie daisy! Your mic's having a spa day! 🧖‍♀️ Give typing a whirl or try Chrome - it's the mic whisperer! 😜");
      toast.error("🎙️ Mic's MIA! No worries - keyboard warriors unite! ⌨️💪");
      return;
    }

    if (!isApiKeyValid) {
      toast.error("🔑 No API key! Open the sidebar and add one to start talking! 🚀", {
        duration: 4000,
      });
      setIsSidebarOpen(true);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setError("");
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
        if (err.name === 'NotAllowedError') {
          toast.error("🚫 Mic permission denied! Please enable and try again!");
        } else {
          toast.error("🤖 Speech recognition hiccup! Try again!");
        }
      }
    }
  };

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

  // Fetch LLM response with fixed context
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
      
      // Build messages in the correct order: oldest to newest
      const messages = [
        {
          role: "system",
          content: "You are a helpful assistant. Format your responses using Markdown syntax (e.g., **bold**, *italic*, - lists) for clarity and readability. Use simple HTML tags (e.g., <b>, <i>, <ul>) only when Markdown is insufficient. Ensure all formatting is professional, and avoid inline styles or scripts."
        }
      ];
      
      // Add chat history in chronological order
      chatHistory.forEach((chat) => {
        messages.push({ role: "user", content: chat.input });
        messages.push({ role: "assistant", content: chat.response });
      });
      
      // Add the new user input
      messages.push({ role: "user", content: input });
      
      // If token limit exceeded, keep most recent conversations
      const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
      if (totalTokens > 3000) {
        const recentMessages = messages.slice(0, 1).concat(messages.slice(-21));
        messages.splice(0, messages.length, ...recentMessages);
      }
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 500,
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
        if (recognitionRef.current && !isListening) {
          setIsPreRestart(false);
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.error('Auto-restart failed:', err);
            setIsPreRestart(false);
          }
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
      } else {
        toast.error("🔑 No API key! Open the sidebar and add one to start chatting! 🚀", {
          duration: 4000,
        });
        setIsSidebarOpen(true);
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

  useEffect(() => {
    const scrollToBottom = () => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    };

    // Scroll immediately when loading starts
    if (isLoading) {
      setTimeout(scrollToBottom, 800);
    }

    // MutationObserver to detect DOM changes
    const observer = new MutationObserver(() => {
      scrollToBottom();
    });

    if (chatContainerRef.current) {
      observer.observe(chatContainerRef.current, {
        childList: true,
        subtree: true
      });
    }

    // Cleanup on component unmount
    return () => observer.disconnect();
  }, [isLoading]);

  // Focus text input when shown
  useEffect(() => {
    if (showTextInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [showTextInput]);

  // Change theme
  const handleThemeChange = (theme) => {
    setSelectedTheme(theme);
    localStorage.setItem("selectedTheme", theme.id);
    setShowThemes(false);
    toast.success(`🎨 ${theme.name} theme activated! Looking good! ✨`);
  };

  // Determine if chat should be shown
  const showChat = chatHistory.length > 0 || isLoading;

   return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-gradient-to-br ${selectedTheme.bg} animate-gradient overflow-hidden`}>
      {/* Custom CSS for animations and Markdown/HTML styling */}
      <style jsx>{`
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
        @keyframes attention-glow {
          0% { box-shadow: 0 0 10px rgba(255, 255, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.4); }
          50% { box-shadow: 0 0 20px rgba(255, 255, 0, 0.8), 0 0 40px rgba(0, 255, 255, 0.7); }
          100% { box-shadow: 0 0 10px rgba(255, 255, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.4); }
        }
        .animate-attention-glow {
          animation: attention-glow 1.5s ease-in-out infinite;
        }
        @keyframes pulse-border {
          0% { border-color: rgba(255, 255, 0, 0.5); box-shadow: 0 0 10px rgba(255, 255, 0, 0.5); }
          50% { border-color: rgba(255, 255, 0, 1); box-shadow: 0 0 20px rgba(255, 255, 0, 0.8); }
          100% { border-color: rgba(255, 255, 0, 0.5); box-shadow: 0 0 10px rgba(255, 255, 0, 0.5); }
        }
        .animate-pulse-border {
          animation: pulse-border 1.5s ease-in-out infinite;
        }
        @keyframes bounce-dot {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-dot1 { animation: bounce-dot 0.6s infinite; }
        .animate-bounce-dot2 { animation: bounce-dot 0.6s infinite 0.2s; }
        .animate-bounce-dot3 { animation: bounce-dot 0.6s infinite 0.4s; }
        @keyframes slide-left {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-left {
          animation: slide-left 0.5s ease-out forwards;
        }
        .animate-slide-right {
          animation: slide-right 0.5s ease-out forwards;
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
        /* Markdown and HTML styling */
        .markdown-content ul {
          list-style-type: disc;
          margin-left: 1.5em;
          margin-bottom: 0.5em;
        }
        .markdown-content ol {
          list-style-type: decimal;
          margin-left: 1.5em;
          margin-bottom: 0.5em;
        }
        .markdown-content li {
          margin-bottom: 0.25em;
        }
        .markdown-content strong {
          font-weight: 700;
        }
        .markdown-content em {
          font-style: italic;
        }
        .markdown-content p {
          margin-bottom: 0.5em;
        }
        .markdown-content a {
          color: #60a5fa;
          text-decoration: underline;
        }
        .markdown-content a:hover {
          color: #3b82f6;
        }
      `}</style>

      {/* Toaster for notifications */}
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { 
            background: "#1f2937",
            color: "#fff",
            borderRadius: "15px",
            padding: "12px 20px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            }
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            }
          }
        }} 
      />

      {/* Sidebar */}
      <div
        className={`sidebar fixed inset-y-0 left-0 z-20 bg-gradient-to-b ${selectedTheme.sidebar} backdrop-blur-xl border-r border-${selectedTheme.accent}/40 transition-all duration-500 ease-out transform ${
          isSidebarOpen ? "w-full md:w-80 translate-x-0" : "w-0 -translate-x-full"
        }`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-4 ${isSidebarOpen ? 'left-4' : 'left-4'} p-3 bg-gradient-to-r ${selectedTheme.micIdle} rounded-full hover:scale-105 transition-all duration-300 shadow-lg ${
            !isSidebarOpen ? 'fixed z-30' : ''
          } ${isApiKeyValid !== true ? 'animate-attention-glow' : ''}`}
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
        
        {isSidebarOpen && (
          <div className="p-6 mt-16">
            <h2
              className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-${selectedTheme.accent} mb-6 ${
                isApiKeyValid !== true ? 'animate-attention-glow' : ''
              }`}
            >
              🚀 GPT-3.5 Turbo Key 🚀
            </h2>
            <input
              type="password"
              placeholder={isApiKeyValid !== true ? "🔑 Add your API key to unlock AI magic! ✨" : "Drop your magic key here! ✨"}
              value={apiKey}
              onChange={handleApiKeyChange}
              className={`w-full p-3 rounded-xl bg-gradient-to-r ${selectedTheme.input} backdrop-blur-sm text-cyan-200 placeholder-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-${selectedTheme.accent}/70 border border-${selectedTheme.accent}/20 transition-all duration-300 ${
                isApiKeyValid !== true ? 'animate-pulse-border' : ''
              }`}
            />
            <div aria-live="polite">
              {isApiKeyValid === false && <p className={`text-${selectedTheme.accent} mt-2 text-sm animate-pulse`}>{error}</p>}
              {isApiKeyValid === true && (
                <p className={`text-green-400 mt-2 text-sm font-semibold animate-bounce`}>🎯 Boom! We're locked and loaded! 🎉</p>
              )}
              {!isApiKeyValid && (
                <p className={`text-yellow-300 mt-3 text-xs animate-fade-in`}>
                  No key? No worries! Just feed me some OpenAI magic and we're good to go! 😎{' '}
                  <a
                    href="https://platform.openai.com/account/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-${selectedTheme.accent} underline hover:text-${selectedTheme.accent}/80 transition-colors`}
                  >
                    Get one here!
                  </a>
                </p>
              )}
            </div>
            
            {/* Theme Selection */}
            <div className="mt-8">
              <button
                onClick={() => setShowThemes(!showThemes)}
                className={`w-full p-3 bg-gradient-to-r ${selectedTheme.micIdle} text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-lg`}
              >
                <Palette className="w-5 h-5" />
                🎨 Change Theme
              </button>
              
              {showThemes && (
                <div className="mt-4 max-h-64 overflow-y-auto">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme)}
                      className={`w-full p-3 mt-2 bg-gradient-to-r ${theme.userMsg} text-white rounded-lg transition-all duration-300 text-sm ${
                        selectedTheme.id === theme.id ? 'ring-2 ring-white/30' : 'hover:opacity-90'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Clear Chat Button */}
            {chatHistory.length > 0 && (
              <button
                onClick={clearChatHistory}
                className={`mt-8 w-full p-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-lg`}
              >
                <Trash2 className="w-5 h-5" />
                🧹 Sweep it clean!
              </button>
            )}
          </div>
        )}
      </div>

       <div className={`main-content flex-1 flex flex-col transition-all duration-500 relative ${
        isSidebarOpen ? "md:ml-80" : "md:ml-0"
      }`}>
        
        {!showChat && (
          // Landing Screen
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <h1 className={`text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-${selectedTheme.accent} to-yellow-300 mb-6 animate-pulse md:text-7xl text-center tracking-wider drop-shadow-lg`}>
              🎤 Talk & Chat! 🤖
            </h1>
            <p className="text-center animate-fade-in max-w-lg text-lg">
              <span className="text-yellow-300">Hey there, chatterbox! 👋</span>{" "}
              <span className={`text-${selectedTheme.accent}`}>Hit that groovy mic button 🔥</span>{" "}
              <span className="text-cyan-300">or type away like a boss! 💪</span>
            </p>
          </div>
        )}

        {showChat && (
          // Chat Interface (Full Screen)
          <div className="flex-1 flex flex-col h-screen pb-18">
            {/* Chat Display */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-black/5 to-black/10 backdrop-blur-sm"
            >
              <div className="max-w-4xl mx-auto">
                {chatHistory.map((chat, index) => (
                  <div key={index} className="mb-6">
                    <div className="flex justify-end mb-3">
                      <div className={`markdown-content p-4 rounded-2xl bg-gradient-to-br ${selectedTheme.userMsg} text-white max-w-[80%] backdrop-blur-sm shadow-lg hover:shadow-blue-500/20 transition-all duration-300 animate-slide-right`}>
                        <ReactMarkdown
                          remarkPlugins={[]}
                          components={{
                            code: ({children, inline}) => (
                              inline ? <code>{children}</code> : <pre><code>{children}</code></pre>
                            ),
                            a: ({children, href}) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                {children}
                              </a>
                            ),
                            p: ({children}) => <p className="mb-2">{children}</p>,
                            li: ({children}) => <li className="ml-4">• {children}</li>,
                            strong: ({children}) => <strong className="font-bold">{children}</strong>,
                            em: ({children}) => <em className="italic">{children}</em>
                          }}
                        >
                          {chat.input}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className={`markdown-content p-4 rounded-2xl bg-gradient-to-br ${selectedTheme.aiMsg} text-white max-w-[80%] backdrop-blur-sm shadow-lg hover:shadow-pink-500/20 transition-all duration-300 animate-slide-left`}>
                        <ReactMarkdown
                          remarkPlugins={[]}
                          components={{
                            code: ({children, inline}) => (
                              inline ? <code>{children}</code> : <pre><code>{children}</code></pre>
                            ),
                            a: ({children, href}) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                {children}
                              </a>
                            ),
                            p: ({children}) => <p className="mb-2">{children}</p>,
                            li: ({children}) => <li className="ml-4">• {children}</li>,
                            strong: ({children}) => <strong className="font-bold">{children}</strong>,
                            em: ({children}) => <em className="italic">{children}</em>
                          }}
                        >
                          {chat.response}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white animate-slide-left`}>
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

        {/* Microphone Button - Adjusted for mobile */}
        <button
          onClick={toggleListening}
          className={`fixed ${showChat ? 'bottom-24 md:bottom-12' : 'bottom-8'} right-6 md:right-8 p-5 rounded-full transition-all duration-300 z-30 transform hover:scale-110 ${
            isListening
              ? `bg-gradient-to-r ${selectedTheme.micActive} animate-glow shadow-lg shadow-red-500/70 ring-4 ring-red-400/30`
              : isPreRestart
              ? `bg-gradient-to-r from-orange-500 to-yellow-500 animate-pulse-pre-restart shadow-lg shadow-orange-500/70 ring-4 ring-orange-400/30`
              : `bg-gradient-to-r ${selectedTheme.micIdle} hover:from-cyan-600 hover:to-blue-600 shadow-xl shadow-cyan-500/50 ring-4 ring-cyan-400/20`
          }`}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 text-white drop-shadow-lg" />
          ) : (
            <Mic className={`w-8 h-8 text-white drop-shadow-lg`} />
          )}
        </button>

        {/* Text Input - Always at bottom */}
        <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 backdrop-blur-xl p-3 border-t border-${selectedTheme.accent}/20 ${
          isSidebarOpen ? "md:pl-80" : ""
        }`}>
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              ref={textInputRef}
              type="text"
              placeholder="Whatcha wanna say? Drop it like it's hot! 🔥"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`flex-1 p-4 rounded-2xl bg-gradient-to-r ${selectedTheme.input} backdrop-blur-sm text-cyan-100 placeholder-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-${selectedTheme.accent}/70 border border-${selectedTheme.accent}/30 transition-all duration-300 text-lg`}
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