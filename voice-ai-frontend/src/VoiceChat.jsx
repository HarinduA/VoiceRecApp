import React, { useState, useEffect, useRef } from 'react';

const userAvatar = '';
const botAvatar = 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png';
const BACKEND_URL = 'https://voicerecbackend-production.up.railway.app'; // your backend

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
  const vapiRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (window.vapi) {
      const vapi = new window.vapi.WebVoiceSDK({
        apiKey: 'd8291446-ef94-430e-9fca-d97ea0b656c4',
      });

      vapiRef.current = vapi;

      vapi.on('speech', async (msg) => {
        if (!msg.transcript || !msg.isFinal) return;

        const query = msg.transcript;
        handleUserQuery(query);
      });

      vapi.on('end', () => {
        setListening(false);
      });
    }
  }, []);

  function speakText(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }

  async function handleUserQuery(userQuery) {
    const userMsg = { from: 'user', text: userQuery, time: formatTime(new Date()) };
    setMessages((msgs) => [...msgs, userMsg]);

    try {
      const response = await fetch(`${BACKEND_URL}/search?q=${encodeURIComponent(userQuery)}`);
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
    } catch {
      const botMsg = {
        from: 'bot',
        text: "Sorry, I couldn't find any of those items.",
        time: formatTime(new Date())
      };
      setMessages((msgs) => [...msgs, botMsg]);
      speakText("Sorry, I couldn't find any of those items.");
    }
  }

  const startListening = () => {
    if (listening || !vapiRef.current) return;
    setListening(true);
    vapiRef.current.start();
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
            onClick={startListening}
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
