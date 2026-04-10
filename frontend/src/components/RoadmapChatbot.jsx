import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import axios from '../api/axiosConfig';
import { MessageCircle, X, Send, Loader2, Bot, User, Trash2 } from 'lucide-react';

// ── Inline markdown renderer for chat bubbles ──
function ChatMessage({ text }) {
  const lines = text.split('\n');

  const fmt = (s) =>
    s
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`\n]+)`/g, '<code style="background:rgba(99,102,241,0.15);padding:1px 5px;border-radius:4px;font-size:0.85em;font-family:monospace">$1</code>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) { i++; continue; }

    // Heading ## or ###
    if (line.startsWith('### ')) {
      elements.push(<div key={i} className="font-semibold text-blue-300 mt-2 mb-0.5 text-sm" dangerouslySetInnerHTML={{ __html: fmt(line.slice(4)) }} />);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<div key={i} className="font-bold text-blue-300 mt-2 mb-1 text-sm" dangerouslySetInnerHTML={{ __html: fmt(line.slice(3)) }} />);
      i++; continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<div key={i} className="font-bold text-blue-200 mt-2 mb-1 text-sm" dangerouslySetInnerHTML={{ __html: fmt(line.slice(2)) }} />);
      i++; continue;
    }

    // Bullet list — collect consecutive bullet lines
    if (/^[*\-•]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[*\-•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[*\-•]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="mt-1 mb-1 space-y-0.5 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5 text-sm leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: fmt(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list — collect consecutive numbered lines
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const num = lines[i].trim().match(/^(\d+)\./)[1];
        const content = lines[i].trim().replace(/^\d+\.\s+/, '');
        items.push({ num, content });
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="mt-1 mb-1 space-y-0.5 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="font-bold text-blue-400 shrink-0 min-w-[1.2rem]">{item.num}.</span>
              <span dangerouslySetInnerHTML={{ __html: fmt(item.content) }} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: fmt(line) }} />
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

export default function RoadmapChatbot({ context }) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: `Hi! I'm your AI learning assistant 👋\n\nAsk me anything about ${context?.topic || 'your current topic'} — concepts, examples, or clarifications.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await axios.post('/chatbot/ask', { message: text, context });
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: data.response }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: 'Sorry, I ran into an issue. Please try again.', error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => setMessages([{
    id: Date.now(), role: 'assistant',
    text: `Hi! I'm your AI learning assistant 👋\n\nAsk me anything about ${context?.topic || 'your current topic'}.`,
  }]);

  const panel = isDark ? 'bg-[#0f1115] border border-gray-800' : 'bg-white border border-gray-200';
  const msgArea = isDark ? 'bg-[#0a0e14]' : 'bg-gray-50';
  const aiBubble = isDark ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-white text-gray-800 border border-gray-200 shadow-sm';
  const inputCls = isDark
    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500';
  const sendDisabled = !input.trim() || loading;

  return (
    <>
      {/* FAB — only show when chat is closed */}
      {!open && (
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl bg-blue-600 hover:bg-blue-500 shadow-blue-500/30 transition-all"
          title="AI Learning Assistant"
        >
          <MessageCircle size={22} />
        </motion.button>
      )}

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl overflow-hidden shadow-2xl flex flex-col ${panel}`}
            style={{ height: 560 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm leading-tight">AI Assistant</div>
                  <div className="text-white/70 text-[10px]">{context?.topic ? `Studying: ${context.topic}` : 'Learning helper'}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={clearChat} title="Clear chat" className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"><Trash2 size={14} /></button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto px-3 py-3 space-y-3 ${msgArea}`}>
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-blue-600' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    {msg.role === 'user'
                      ? <User size={13} className="text-white" />
                      : <Bot size={13} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                    }
                  </div>
                  <div className={`max-w-[80%] px-3 py-2.5 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white text-sm leading-relaxed' : aiBubble} ${msg.error ? 'border-red-500/50 text-red-400' : ''}`}>
                    {msg.role === 'user'
                      ? <p className="text-sm leading-relaxed">{msg.text}</p>
                      : <ChatMessage text={msg.text} />
                    }
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 items-end">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <Bot size={13} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                  </div>
                  <div className={`px-4 py-3 rounded-2xl ${aiBubble}`}>
                    <div className="flex gap-1 items-center">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className={`px-3 py-3 border-t shrink-0 ${isDark ? 'border-gray-800 bg-[#0f1115]' : 'border-gray-100 bg-white'}`}>
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask a question..."
                  rows={1}
                  className={`flex-1 resize-none rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${inputCls}`}
                  style={{ maxHeight: 96, overflowY: 'auto' }}
                />
                <button
                  onClick={send}
                  disabled={sendDisabled}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${sendDisabled ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>
              <p className={`text-[10px] mt-1.5 text-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
