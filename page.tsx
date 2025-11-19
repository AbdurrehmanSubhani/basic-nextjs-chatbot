'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

export default function Page() {
  const { messages, status, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log('Sending message:', input);
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <strong>{`${message.role}: `}</strong>
          {message.parts.map((part, index) => {
            switch (part.type) {
              case 'text':
                return <span key={index}>{part.text}</span>;

              // other cases can handle images, tool calls, etc
            }
          })}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          placeholder="Send a message..."
          onChange={e => setInput(e.target.value)}
          disabled={status !== 'ready'}
        />
      </form>
    </div>
  );
}
