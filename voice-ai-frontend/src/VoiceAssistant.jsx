import { useEffect, useRef } from 'react';
import { Vapi } from '@vapi-ai/web';

const VoiceAssistant = () => {
  const vapiRef = useRef(null);

  useEffect(() => {
    const initVapi = async () => {
      const vapi = new Vapi({
        apiKey: '6aaa052d-1fe8-4051-b447-3eaf652764c6', // Your PUBLIC_API_KEY
      });

      await vapi.setAssistant({
        assistantId: 'ef6c654e-44d9-408b-af88-c0a37e931b43', // Your VAPI_ASSISTANT_ID
      });

      vapi.on('speech', (speech) => {
        console.log('User said:', speech.transcript);
      });

      vapi.on('response', (response) => {
        console.log('Assistant replied:', response.transcript);
      });

      vapiRef.current = vapi;
    };

    initVapi();

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  const handleStart = () => {
    if (vapiRef.current) {
      vapiRef.current.start();
      console.log('Listening started...');
    }
  };

  return (
    <div>
      <h1>🎙️ Voice Assistant</h1>
      <button onClick={handleStart}>Start Listening</button>
    </div>
  );
};

export default VoiceAssistant;
