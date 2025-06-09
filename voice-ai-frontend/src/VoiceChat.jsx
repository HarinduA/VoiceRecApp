import React, { useState, useEffect, useRef } from 'react';

const userAvatar = ''; // Optional user avatar URL
const botAvatar = 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png';

// Your VAPI credentials
const VAPI_API_KEY = '9fa9d353-27d1-4fc4-b636-7d121ab7ff53';
const AGENT_ID = 'd17442ad-a6d9-4628-9dba-49ff9ee0e43b';

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function VoiceChat() {
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to initialize VAPI and set up event listeners
  const initializeVapi = () => {
    if (window.vapi) {
      window.vapi.init({ apiKey: VAPI_API_KEY });

      // Register event handlers once
      window.vapi.on('transcript', onTranscript);
      window.vapi.on('agentResponse', onAgentResponse);
      window.vapi.on('end', onEnd);
      window.vapi.on('error', onError);
      console.log("VAPI SDK initialized and event listeners registered.");
    } else {
      console.error("VAPI object not found, cannot initialize.");
    }
  };

  // Load VAPI SDK script & init on mount
  useEffect(() => {
    // Check if VAPI SDK is already loaded
    if (window.vapi) {
      console.log("VAPI SDK already loaded, initializing.");
      initializeVapi();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.vapi.ai/sdk/vapi.js';
    script.async = true;

    script.onload = () => {
      // Small delay to ensure VAPI is fully ready in the global scope
      setTimeout(() => {
        if (window.vapi) {
          console.log("VAPI SDK script loaded. Attempting initialization...");
          initializeVapi();
        } else {
          console.error("VAPI SDK failed to load or initialize after script onload. window.vapi is undefined.");
        }
      }, 100); // Give it a short delay
    };

    script.onerror = (e) => {
      console.error("Failed to load VAPI SDK script:", e);
      // You might want to display a user-friendly error message here
    };

    document.body.appendChild(script);

    // Cleanup event listeners on unmount
    return () => {
      if (window.vapi) {
        window.vapi.off('transcript', onTranscript);
        window.vapi.off('agentResponse', onAgentResponse);
        window.vapi.off('end', onEnd);
        window.vapi.off('error', onError);
        console.log("VAPI event listeners cleaned up.");
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Speak text using Web Speech API
  function speakText(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }

  // Handle transcript event from VAPI
  const onTranscript = (data) => {
    const query = data.transcript.trim();
    if (query) {
      processQuery(query);
    }
  };

  // Handle agent response event from VAPI
  const onAgentResponse = (data) => {
    const response = data.text;
    if (response) {
      const botMsg = { from: 'bot', text: response, time: formatTime(new Date()) };
      setMessages((msgs) => [...msgs, botMsg]);
      speakText(response);
    }
  };

  // Handle conversation end
  const onEnd = () => {
    setListening(false);
    console.log("VAPI conversation ended.");
  };

  // Handle errors
  const onError = (error) => {
    console.error('Vapi error:', error);
    setListening(false);
    const errorMsg = { from: 'bot', text: "An error occurred with the AI assistant. Please try again.", time: formatTime(new Date()) };
    setMessages((msgs) => [...msgs, errorMsg]);
    speakText(errorMsg.text);
  };

  // Call your backend search API and process response
  const processQuery = async (userQuery) => {
    const userMsg = { from: 'user', text: userQuery, time: formatTime(new Date()) };
    setMessages((msgs) => [...msgs, userMsg]);

    try {
      const response = await fetch(`https://voicerecbackend-production.up.railway.app/search?q=${encodeURIComponent(userQuery)}`);
      const result = await response.json();

      if (!response.ok || !result.items || result.items.length === 0) {
        throw new Error('No items found');
      }

      const itemNames = result.items.map(i => capitalize(i.name)).join(', ');
      const itemDetails = result.items.map((item) =>
        `• Code: ${item.code || 'N/A'}\n  Name: ${capitalize(item.name) || 'N/A'}\n  Price: $${item.price || 'N/A'}`
      ).join('\n\n');

      const fullBotMessage = `For your requirements (${itemNames}), here are the item details:\n\n${itemDetails}`;

      const botMsg = { from: 'bot', text: fullBotMessage, time: formatTime(new Date()) };
      setMessages((msgs) => [...msgs, botMsg]);
      speakText(fullBotMessage);
    } catch (error) {
      console.error("Error processing query with backend:", error);
      const botMsg = {
        from: 'bot',
        text: "Sorry, I couldn't find any of those items or there was an issue connecting to the product database.",
        time: formatTime(new Date())
      };
      setMessages((msgs) => [...msgs, botMsg]);
      speakText(botMsg.text);
    }
  };

  // Start voice conversation
  const toggleListening = () => {
    if (!window.vapi) {
      console.warn("VAPI SDK not loaded or initialized yet. Please wait.");
      const tempMsg = { from: 'bot', text: "AI assistant is still loading. Please wait a moment and try again.", time: formatTime(new Date()) };
      setMessages((msgs) => [...msgs, tempMsg]);
      speakText(tempMsg.text);
      return;
    }

    if (listening) {
      window.vapi.stopConversation(); // Assuming VAPI has a stop method
      setListening(false);
      console.log("Stopping VAPI conversation.");
    } else {
      setListening(true);
      window.vapi.startConversation({ agentId: AGENT_ID });
      console.log("Starting VAPI conversation.");
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ backgroundColor: '#1f1f1f', color: 'white', height: '85vh', width: '100%', maxWidth: 480, borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', position: 'relative', padding: '16px 0' }}>
        <div style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: '600', marginBottom: 8 }}>
          AI Assistant
        </div>

        <div style={{ overflowY: 'auto', flexGrow: 1, padding: '0 16px', marginBottom: 80 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: msg.from === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', marginBottom: 16 }}>
              <img src={msg.from === 'user' ? userAvatar : botAvatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', margin: '0 10px' }} />
              <div style={{ backgroundColor: msg.from === 'user' ? '#2563eb' : '#333', padding: '10px 14px', borderRadius: 16, maxWidth: '75%', whiteSpace: 'pre-wrap', fontSize: 14 }}>
                {msg.text}
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{msg.time}</div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}>
          <button
            onClick={toggleListening}
            disabled={listening}
            style={{
              background: listening
                ? 'linear-gradient(to right, #ef4444, #f97316)'
                : 'linear-gradient(to right, #3b82f6, #9333ea)',
              borderRadius: '50%',
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              color: 'white',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              border: 'none',
              cursor: listening ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s ease, background 0.3s ease'
            }}
          >
            🎤
          </button>
        </div>
      </div>
    </div>
  );
}