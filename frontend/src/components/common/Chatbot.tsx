import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { chatbotAPI } from '../../services/api';

type PropertyLink = {
  _id: string;
  title: string;
  location: string;
  price: number;
  beds: number;
  image: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  properties?: PropertyLink[];
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: 'Hi there! I am your BuildEstate assistant. Looking for a property or have any questions?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await chatbotAPI.chat({ message: userMsg.text });
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: res.data.reply,
        properties: res.data.properties
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'Sorry, I am having trouble connecting. Please try again later.'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            aria-label="Open Chatbot"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50 p-4 bg-[#D4755B] text-white rounded-full shadow-lg hover:bg-[#B86851] hover:shadow-xl transition-all"
            onClick={() => setIsOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
            style={{ maxHeight: '600px', height: '80vh' }}
          >
            {/* Header */}
            <div className="bg-[#D4755B] p-4 flex justify-between items-center text-white">
              <div className="flex flex-row items-center gap-2">
                <Bot size={24} />
                <h3 className="font-fraunces font-bold text-lg">BuildEstate Assistant</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3 font-manrope">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div 
                      className={`p-3 text-sm whitespace-pre-wrap ${
                        msg.role === 'user' 
                          ? 'bg-[#D4755B] text-white rounded-2xl rounded-br-sm shadow-sm' 
                          : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.properties && msg.properties.length > 0 && (
                      <div className="flex flex-col gap-2 mt-1">
                        {msg.properties.map((prop, idx) => {
                          const priceFormatted = prop.price >= 10000000 
                            ? `₹${(prop.price / 10000000).toFixed(2)} Cr` 
                            : `₹${(prop.price / 100000).toFixed(2)} Lakhs`;
                          
                          return (
                            <Link 
                              key={`${prop._id}-${idx}`} 
                              to={`/property/${prop._id}`}
                              onClick={() => setIsOpen(false)}
                              className="flex gap-3 p-2 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow group cursor-pointer"
                            >
                              <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                {prop.image ? (
                                  <img src={prop.image} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-1">No Image</div>
                                )}
                              </div>
                              <div className="flex flex-col flex-1 justify-center">
                                <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{prop.title}</h4>
                                <p className="text-[10px] text-gray-500 line-clamp-1">{prop.location}</p>
                                <div className="mt-1 flex justify-between items-center text-[#D4755B]">
                                  <span className="text-xs font-bold">{priceFormatted}</span>
                                  <ExternalLink size={12} className="opacity-50 group-hover:opacity-100" />
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-3 rounded-2xl bg-white border border-gray-100 rounded-bl-sm flex gap-1 items-center shadow-sm">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form 
              onSubmit={handleSend}
              className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#D4755B] focus:border-transparent font-manrope text-sm transition-all"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={!inputValue.trim() || isLoading}
                className="p-2 bg-[#D4755B] text-white rounded-full hover:bg-[#B86851] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
