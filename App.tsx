import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GenerateContentResponse, Chat } from "@google/genai";
import { ChatMessage, Sender, MessageType, LoadingState } from './types';
import * as GeminiService from './services/gemini';
import ChatMessageComponent from './components/ChatMessage';
import Lesson from './components/Lesson';

const SUGGESTED_QUESTIONS = [
  "Explain photosynthesis simply",
  "How do vaccines work?",
  "Difference between DNA and RNA",
  "What is natural selection?"
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: Sender.Model,
      type: MessageType.Text,
      text: "Hello! I'm BioBuddy, your biology tutor. I can explain complex concepts, draw diagrams, quiz you, or help you explore the Kingdoms of Life. What shall we learn today?",
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState<LoadingState>({ isActive: false, message: '' });
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [showLesson, setShowLesson] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize chat session on mount
  useEffect(() => {
    try {
      const chat = GeminiService.createChatSession();
      setChatSession(chat);
    } catch (e) {
      console.error("Failed to initialize chat", e);
    }
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!showLesson) {
        scrollToBottom();
    }
  }, [messages, loading.isActive, showLesson]);

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim() || !chatSession) return;

    const userMsgId = Date.now().toString();
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: Sender.User,
      type: MessageType.Text,
      text: text,
      timestamp: Date.now()
    };

    addMessage(userMessage);
    setInputText('');
    setLoading({ isActive: true, message: 'Thinking...' });

    try {
      // Stream the response
      const result = await chatSession.sendMessageStream({ message: text });
      
      const responseMsgId = (Date.now() + 1).toString();
      let fullText = "";
      
      // Initialize placeholder message for streaming
      setMessages(prev => [...prev, {
        id: responseMsgId,
        sender: Sender.Model,
        type: MessageType.Text,
        text: "",
        timestamp: Date.now()
      }]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullText += c.text;
          setMessages(prev => prev.map(msg => 
            msg.id === responseMsgId ? { ...msg, text: fullText } : msg
          ));
        }
      }
    } catch (error) {
      console.error(error);
      addMessage({
        id: Date.now().toString(),
        sender: Sender.Model,
        type: MessageType.Error,
        text: "Sorry, I encountered an error. Please try asking again.",
        timestamp: Date.now()
      });
    } finally {
      setLoading({ isActive: false, message: '' });
    }
  };

  const handleGenerateQuiz = async () => {
    const topic = window.prompt("What topic would you like a quiz on? (e.g., Mitosis, Genetics)");
    if (!topic) return;

    setLoading({ isActive: true, message: `Creating a quiz on ${topic}...` });
    
    // Add a system message saying we are generating
    addMessage({
        id: Date.now().toString(),
        sender: Sender.User,
        type: MessageType.Text,
        text: `Generate a quiz about ${topic}`,
        timestamp: Date.now()
    });

    try {
      const quizData = await GeminiService.generateBiologyQuiz(topic, 'medium');
      addMessage({
        id: (Date.now() + 1).toString(),
        sender: Sender.Model,
        type: MessageType.Quiz,
        quizData: quizData,
        timestamp: Date.now()
      });
    } catch (error) {
      addMessage({
        id: Date.now().toString(),
        sender: Sender.Model,
        type: MessageType.Error,
        text: "Could not generate quiz. Please check your API limits or try again.",
        timestamp: Date.now()
      });
    } finally {
      setLoading({ isActive: false, message: '' });
    }
  };

  const handleGenerateDiagram = async () => {
    const description = window.prompt("Describe the biological diagram you want (e.g., Animal Cell structure):");
    if (!description) return;

    setLoading({ isActive: true, message: 'Drawing diagram...' });
    
    // Add user request
    addMessage({
        id: Date.now().toString(),
        sender: Sender.User,
        type: MessageType.Text,
        text: `Draw a diagram of: ${description}`,
        timestamp: Date.now()
    });

    try {
      const imageUrl = await GeminiService.generateDiagram(description);
      addMessage({
        id: (Date.now() + 1).toString(),
        sender: Sender.Model,
        type: MessageType.Image,
        text: `Here is a diagram of ${description}.`,
        imageUrl: imageUrl,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(error);
      addMessage({
        id: Date.now().toString(),
        sender: Sender.Model,
        type: MessageType.Error,
        text: "Could not generate image. Please try again.",
        timestamp: Date.now()
      });
    } finally {
      setLoading({ isActive: false, message: '' });
    }
  };

  if (showLesson) {
    return <Lesson onClose={() => setShowLesson(false)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-emerald-600 text-white shadow-md z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧬</span>
            <h1 className="text-xl font-bold tracking-tight">BioBuddy</h1>
          </div>
          <div className="text-xs md:text-sm bg-emerald-700 px-3 py-1 rounded-full opacity-90">
            Powered by Gemini
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-grow overflow-y-auto px-4 py-6 scrollbar-hide">
        <div className="max-w-4xl mx-auto flex flex-col min-h-full justify-end">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <p>Start your biology journey here.</p>
            </div>
          )}
          
          {messages.map(msg => (
            <ChatMessageComponent key={msg.id} message={msg} />
          ))}

          {loading.isActive && (
            <div className="flex items-center gap-2 text-slate-500 text-sm ml-2 mb-4 animate-pulse">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></div>
              <span className="ml-2">{loading.message}</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none bg-white border-t border-slate-200 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* Quick Actions */}
          {messages.length < 3 && !loading.isActive && (
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
               {SUGGESTED_QUESTIONS.map((q, i) => (
                 <button
                   key={i}
                   onClick={() => handleSendMessage(q)}
                   className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-full text-sm border border-slate-200 transition-colors"
                 >
                   {q}
                 </button>
               ))}
             </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowLesson(true)}
              disabled={loading.isActive}
              className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex flex-col items-center justify-center gap-0.5 w-16 flex-shrink-0"
              title="Kingdoms Lesson"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span className="text-[10px] font-medium">Learn</span>
            </button>

            <button 
              onClick={handleGenerateQuiz}
              disabled={loading.isActive}
              className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex flex-col items-center justify-center gap-0.5 w-16 flex-shrink-0"
              title="Generate Quiz"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              <span className="text-[10px] font-medium">Quiz</span>
            </button>
            
            <button 
              onClick={handleGenerateDiagram}
              disabled={loading.isActive}
              className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex flex-col items-center justify-center gap-0.5 w-16 flex-shrink-0"
              title="Generate Diagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="text-[10px] font-medium">Draw</span>
            </button>

            <div className="flex-grow relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading.isActive && handleSendMessage()}
                placeholder="Ask about biology..."
                disabled={loading.isActive}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || loading.isActive}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400">BioBuddy can make mistakes. Verify important information.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;