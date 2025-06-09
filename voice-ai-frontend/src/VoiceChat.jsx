import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';

const userAvatar = '';
const botAvatar = 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png';

const vapi = new Vapi({
  apiKey: '34f5fbca-0559-4d31-95a8-4f06ed995b57',
});

// ✅ CORS FIX: Override Vapi's createWebCall to use your proxy
vapi.callController.createWebCall = async (body) => {
  const response = await fetch('https://voicerecbackend-production.up.railway.app/proxy/vapi', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Proxy error: ${response.status}`);
  }

  return await response.json();
};

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default function VoiceChat() {
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    vapi.on('transcript', (data) => {
      const query = data.transcript;
      if (!query.trim()) return;

      const userMessage = {
        from: 'user',
        text: query,
        time: formatTime(new Date()),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);

      fetch(`https://voicerecbackend-production.up.railway.app/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data || !data.items || data.items.length === 0) {
            const botMessage = {
              from: 'bot',
              text: 'Sorry, I could not find any item related to that query.',
              time: formatTime(new Date()),
            };
            setMessages((prevMessages) => [...prevMessages, botMessage]);
            speak(botMessage.text);
            return;
          }

          const formattedItems = data.items.map((item) => {
            return `• Code: ${item.code || 'N/A'}\n  Name: ${capitalizeFirstLetter(item.name) || 'N/A'}\n  Price: $${item.price || 'N/A'}`;
          });

          const responseText = `Here are the item details:\n\n${formattedItems.join('\n\n')}`;

          const botMessage = {
            from: 'bot',
            text: responseText,
            time: formatTime(new Date()),
          };

          setMessages((prevMessages) => [...prevMessages, botMessage]);
          speak(botMessage.text);
        })
        .catch((error) => {
          console.error('Error fetching search results:', error);
          const errorMessage = {
            from: 'bot',
            text: 'An error occurred while fetching data. Please try again later.',
            time: formatTime(new Date()),
          };
          setMessages((prevMessages) => [...prevMessages, errorMessage]);
          speak(errorMessage.text);
        });
    });

    vapi.on('end', () => {
      setListening(false);
    });

    return () => {
      vapi.removeAllListeners();
    };
  }, []);

  function speak(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }

  const handleMicClick = () => {
    if (!listening) {
      vapi.start({
        agentId: 'd17442ad-a6d9-4628-9dba-49ff9ee0e43b',
      });
      setListening(true);
    } else {
      vapi.stop();
      setListening(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#1f1f1f',
          color: 'white',
          height: '85vh',
          width: '100%',
          maxWidth: 480,
          borderRadius: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          position: 'relative',
          padding: '16px 0',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: 8,
          }}
        >
          AI Assistant
        </div>

        <div
          style={{
            overflowY: 'auto',
            flexGrow: 1,
            padding: '0 16px',
            marginBottom: 80,
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: msg.from === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                marginBottom: 16,
              }}
            >
              <img
                src={msg.from === 'user' ? userAvatar : botAvatar}
                alt=""
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  margin: '0 10px',
                }}
              />
              <div
                style={{
                  backgroundColor: msg.from === 'user' ? '#2563eb' : '#333',
                  padding: '10px 14px',
                  borderRadius: 16,
                  maxWidth: '75%',
                  whiteSpace: 'pre-wrap',
                  fontSize: 14,
                }}
              >
                {msg.text}
                <div
                  style={{
                    fontSize: 10,
                    color: '#aaa',
                    marginTop: 4,
                  }}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
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
              cursor: listening ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s ease, background 0.3s ease',
            }}
          >
            🎤
          </button>
        </div>
      </div>
    </div>
  );
}
