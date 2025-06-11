// VoiceAssistant.jsx
import React, { useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';  // default import (try this first)

const VoiceAssistant = () => {
  const vapiRef = useRef(null);

  useEffect(() => {
    async function init() {
      try {
        // Create the Vapi client with your public API key
        const vapi = new Vapi({ apiKey: '6aaa052d-1fe8-4051-b447-3eaf652764c6' });

        // Set assistant by ID
        await vapi.setAssistant({ assistantId: 'ef6c654e-44d9-408b-af88-c0a37e931b43' });

        vapiRef.current = vapi;

        console.log('Vapi initialized successfully');

        // Example: start listening (check your library docs if this method exists)
        // await vapi.startListening();

      } catch (error) {
        console.error('Failed to initialize Vapi:', error);
      }
    }

    init();
  }, []);

  return (
    <div>
      <h2>Voice Assistant</h2>
      {/* You can add UI controls here like a "Listen" button */}
      <button
        onClick={() => {
          if (vapiRef.current) {
            vapiRef.current.startListening();
          }
        }}
      >
        Listen
      </button>
    </div>
  );
};

export default VoiceAssistant;
