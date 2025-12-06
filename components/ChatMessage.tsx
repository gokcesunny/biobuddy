import React from 'react';
import { ChatMessage as IChatMessage, Sender, MessageType } from '../types';
import Quiz from './Quiz';

interface ChatMessageProps {
  message: IChatMessage;
}

// Simple formatter for bold text (**text**)
const formatText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="text-emerald-900 font-bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm shadow-sm ${
          isUser ? 'bg-indigo-600 text-white ml-3' : 'bg-emerald-600 text-white mr-3'
        }`}>
          {isUser ? 'You' : 'Bio'}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`relative px-5 py-3.5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-sm' 
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
          }`}>
            
            {message.type === MessageType.Text && message.text && (
              <p>{isUser ? message.text : formatText(message.text)}</p>
            )}

            {message.type === MessageType.Image && message.imageUrl && (
              <div className="mt-2 mb-1">
                <img 
                  src={message.imageUrl} 
                  alt="Generated Diagram" 
                  className="rounded-lg shadow-md max-w-full md:max-w-sm border border-slate-200" 
                />
                {message.text && <p className="mt-2 text-slate-600 italic text-xs">{message.text}</p>}
              </div>
            )}

            {message.type === MessageType.Error && (
              <div className="text-red-500 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {message.text}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-[10px] text-slate-400 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          {/* Quiz (Rendered outside the bubble usually, or inside? Inside makes it part of the flow) */}
          {message.type === MessageType.Quiz && message.quizData && (
             <div className="w-full mt-2">
               <Quiz data={message.quizData} />
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
