'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
};

// 1. Aapke saare possible suggestions ki list
const SUGGESTION_POOL = [
  "✨ Trending Sarees",
  "💃 Party Wear Lehengas",
  "🌸 Palazzo Suits",
  "👑 Anarkali Suits",
  "Show options under ₹5000",
  "What are the new arrivals?",
  "Show me Bridal Wear",
  "Need something for a Haldi ceremony",
  "Looking for pure silk sarees",
  "Best outfits for Mehendi",
  "Show me black ethnic dresses",
  "Plus size ethnic wear",
  "Do you have Salwar Kameez?",
  "Show me Red Banarasi Sarees",
  "Designer gowns for reception"
];

// 2. Is list me se koi bhi 4 random suggestions nikalne ka function
const getRandomSuggestions = (count: number = 4) => {
  const shuffled = [...SUGGESTION_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 1. Initial State me Random Categories
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to Like A Diva! Explore our premium luxury ethnic wear collection. What are you looking for today?',
      suggestions: getRandomSuggestions(5) // <--- Fixed text hata kar yeh likhein
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Main API Call Function
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message to screen
    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await response.json();

      // Add bot reply to screen with next step suggestions
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || "Sorry, I couldn't understand that.",
          suggestions: getRandomSuggestions(4) // <--- Yahan bhi yeh function call karein
        }
      ]);
    } catch (error) {
      console.error('Error fetching reply:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Oops! Something went wrong. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Input Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  // Product Card Parsing Logic
  const renderMessage = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.includes('PRODUCT_CARD')) {
        const parts = line.split('|');
        
        const name = parts.find(p => p.startsWith('Name:'))?.replace('Name:', '').trim();
        const price = parts.find(p => p.startsWith('Price:'))?.replace('Price:', '').trim();
        const image = parts.find(p => p.startsWith('Image:'))?.replace('Image:', '').replace(/[\[\]]/g, '').trim();
        const link = parts.find(p => p.startsWith('Link:'))?.replace('Link:', '').replace(/[\[\]]/g, '').trim();
        const code = parts.find(p => p.startsWith('Code:'))?.replace('Code:', '').trim();
        
        // Bullet points nikalna
        const rawDesc = parts.find(p => p.startsWith('Desc:'))?.replace('Desc:', '').trim();
        const descPoints = rawDesc ? rawDesc.split('~').map(pt => pt.trim()).filter(pt => pt) : [];

        return (
          <div key={index} className="flex flex-col border border-gray-200 rounded-xl p-4 my-3 max-w-sm bg-white shadow-sm hover:shadow-md transition-shadow">
            {image && image.startsWith('http') && (
              <img 
                src={image} 
                alt={name} 
                referrerPolicy="no-referrer"
                // 👇 Yahan maine h-64 aur object-cover ko change kar diya hai
                className="w-full h-auto max-h-80 object-contain bg-gray-50 rounded-lg mb-3" 
              />
            )}
            
            <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">{name}</h3>
            {code && <span className="text-xs font-semibold text-gray-400 mb-2 block">Code: {code}</span>}
            
            <p className="text-pink-600 font-extrabold text-lg mb-3">{price}</p>
            
            {descPoints.length > 0 && (
              <ul className="text-sm text-gray-600 mb-4 list-disc pl-5 space-y-1">
                {descPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            )}
            
            <a href={link} target="_blank" rel="noopener noreferrer" 
               className="text-center bg-gray-900 text-white py-2.5 px-4 rounded-lg hover:bg-pink-600 transition-colors font-medium">
              View Product
            </a>
          </div>
        );
      }
      return <p key={index} className="mb-1 leading-relaxed text-sm md:text-base">{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b py-4 px-6 shadow-sm flex items-center gap-3 z-10">
        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-xl">🛍️</div>
        <div>
          <h1 className="font-bold text-gray-800 text-lg">Like A Diva Stylist</h1>
          <p className="text-xs text-green-500 font-medium">● Online</p>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            
            {/* Chat Bubble */}
            <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-gray-900 text-white rounded-tr-sm' 
                : 'bg-white text-gray-800 border shadow-sm rounded-tl-sm'
            }`}>
              {renderMessage(msg.content)}
            </div>

            {/* Render Suggestion Chips Only for the LAST message */}
            {msg.suggestions && index === messages.length - 1 && (
              <div className="flex flex-wrap gap-2 mt-3 max-w-[85%] md:max-w-[75%]">
                {msg.suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(suggestion)}
                    className="px-4 py-2 text-sm bg-pink-50 text-pink-700 border border-pink-200 rounded-full hover:bg-pink-600 hover:text-white transition-all shadow-sm text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-white border p-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-2 items-center">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your style preferences..."
            className="flex-1 border rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50 text-gray-800"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-gray-900 text-white px-6 py-3 rounded-full font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}