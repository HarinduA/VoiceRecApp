import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';

const botAvatar = 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png';

const VAPI_API_KEY = 'ae62bacb-930b-4e3c-9256-a0061c745507';
const AGENT_ID = 'ef6c654e-44d9-408b-af88-c0a37e931b43';

const vapi = new Vapi({ apiKey: VAPI_API_KEY });

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function VoiceChat() {
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    vapi.on('transcript', (data) => {
      const transcript = data.transcript.trim();
      if (transcript) {
        setMessages((msgs) => [...msgs, { from: 'user', text: transcript, time: formatTime(new Date()) }]);
      }
    });

    vapi.on('agentResponse', (data) => {
      const response = data.text;
      if (response) {
        setMessages((msgs) => [...msgs, { from: 'bot', text: response, time: formatTime(new Date()) }]);
        speakText(response);
      }
    });

    vapi.on('end', () => {
      setListening(false);
    });

    vapi.on('error', (err) => {
      console.error('VAPI error:', err);
      setMessages((msgs) => [...msgs, {
        from: 'bot',
        text: 'An error occurred. Please try again later.',
        time: formatTime(new Date())
      }]);
      speakText('An error occurred. Please try again later.');
      setListening(false);
    });

    return () => vapi.removeAllListeners();
  }, []);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleMicClick = async () => {
    if (!listening) {
      // Override before start
      if (vapi.callController) {
        vapi.callController.createWebCall = async (body) => {
          const response = await fetch('https://voicerecbackend-production.up.railway.app/proxy/vapi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
          return await response.json();
        };
      }

      await vapi.start({ agentId: AGENT_ID });
      setListening(true);
    } else {
      vapi.stop();
      setListening(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#1f1f1f', color: 'white', height: '85vh', width: '100%', maxWidth: 480, borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', position: 'relative', padding: '16px 0' }}>
        <div style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: '600', marginBottom: 8 }}>
          AI Assistant
        </div>

        <div style={{ overflowY: 'auto', flexGrow: 1, padding: '0 16px', marginBottom: 80 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: msg.from === 'user' ? 'row-reverse' : 'row', marginBottom: 16 }}>
              <img src={msg.from === 'bot' ? botAvatar : ''} alt="" style={{ width: 36, height: 36, borderRadius: '50%', margin: '0 10px' }} />
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
            onClick={handleMicClick}
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
              cursor: 'pointer',
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
