'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function PremiumEcomChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! Welcome to Like A Diva. Looking for premium Salwar Suits, Lehengas or Georgette outfits today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 🛠️ SMART PARSER: Hotlinking bypass aur Portrait image layout ke saath
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    const normalText: string[] = [];
    const productCards: any[] = [];

    lines.forEach((line, index) => {
      if (line.includes('PRODUCT_CARD|')) {
        const cleanCardLine = line.substring(line.indexOf('PRODUCT_CARD|'));
        const parts = cleanCardLine.split('|');
        
        const name = parts.find(p => p.startsWith('Name:'))?.replace('Name:', '').trim() || '';
        const price = parts.find(p => p.startsWith('Price:'))?.replace('Price:', '').trim() || '';
        const image = parts.find(p => p.startsWith('Image:'))?.replace('Image:', '').trim() || '';
        const link = parts.find(p => p.startsWith('Link:'))?.replace('Link:', '').trim() || '';

        productCards.push(
          <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col w-full text-black">
            
            {/* 📸 PORTRAIT IMAGE CONTAINER (Bypasses Hotlinking Protection) */}
            <div className="relative w-full h-64 bg-gray-100 overflow-hidden">
              <img 
                src={image} 
                alt={name}
                referrerPolicy="no-referrer" // 🌟 CRITICAL: Bypasses 403 Forbidden image blocks!
                className="w-full h-full object-cover object-top hover:scale-105 transition duration-300"
                onError={(e) => {
                  // Agar image phir bhi na mile, toh yeh ek neutral grey fashion placeholder dikhayega
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80';
                }}
              />
            </div>

            {/* PRODUCT DETAILS */}
            <div className="p-3 flex flex-col flex-1 justify-between gap-3 bg-white">
              <div>
                <h4 className="font-semibold text-xs text-gray-800 line-clamp-2 leading-tight min-h-[2rem]">
                  {name}
                </h4>
                <p className="text-blue-600 font-black text-base mt-1">
                  {price}
                </p>
              </div>

              {/* REDIRECT BUTTON */}
              <a 
                href={link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition active:scale-95"
              >
                Buy on Website 🛍️
              </a>
            </div>

          </div>
        );
      } else {
        if (line.trim() && !line.includes('![Image]') && !line.includes('[View Product]') && !line.includes('Price: ₹')) {
          normalText.push(line);
        }
      }
    });

    return (
      <div className="space-y-3 w-full text-black">
        {normalText.length > 0 && (
          <div className="whitespace-pre-line leading-relaxed">{normalText.join('\n')}</div>
        )}
        {productCards.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-2 w-full">
            {productCards}
          </div>
        )}
      </div>
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, message: input })
      });
      const data = await res.json();
      if (data.reply) {
        if (data.threadId) setThreadId(data.threadId);
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white font-sans border border-gray-200">
      {/* Top Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center gap-3 shadow-md">
        <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
        <div>
          <h2 className="font-bold text-sm">Like A Diva Bot</h2>
          <p className="text-xs text-blue-100">Premium Fashion Assistant</p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
            <div className={`p-3 rounded-2xl shadow-sm text-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none max-w-[80%]' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none w-full max-w-[95%]'
            }`}>
              {m.role === 'user' ? m.content : renderMessageContent(m.content)}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Tray */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2 items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search palazzo suits, lehengas..."
          disabled={isLoading}
          className="flex-1 p-2.5 bg-gray-100 border border-transparent text-sm text-black rounded-full focus:outline-none focus:bg-white focus:border-blue-500 transition"
        />
        <button type="submit" disabled={!input.trim() || isLoading} className="bg-blue-600 text-white p-2.5 rounded-full shadow-md w-10 h-10 flex items-center justify-center">
          🚀
        </button>
      </form>
    </div>
  );
}