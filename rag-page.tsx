'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

export default function Page() {
  const { messages, status, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log('Sending message:', input);
    sendMessage({ text: input });
    setInput('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        alert('File uploaded successfully');
        setFile(null);
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error(error);
      alert('Upload error');
    }
    setUploading(false);
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <form onSubmit={handleSubmit}>
          <input
            value={input}
            placeholder="Send a message..."
            onChange={e => setInput(e.target.value)}
            disabled={status !== 'ready'}
          />
        </form>
        <div>
          <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Submit File'}
          </button>
        </div>
      </div>
    </div>
  );
}
