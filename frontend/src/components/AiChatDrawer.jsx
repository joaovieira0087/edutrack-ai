import React, { useState, useEffect, useRef } from 'react';
import { crudApi } from '../services/api';
import subjectService from '../services/subjectService';

// ─── Markdown Parser Helpers ───────────────────────────────────────────────────
const parseInlineMarkdown = (text) => {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px] text-pink-600 dark:text-pink-400">$1</code>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>');

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

const renderMarkdown = (text) => {
  if (!text) return '';
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('### ')) {
      return <h4 key={i} className="text-xs font-bold mt-3 mb-1 text-slate-900 dark:text-white">{parseInlineMarkdown(line.slice(4))}</h4>;
    }
    if (line.startsWith('## ')) {
      return <h3 key={i} className="text-sm font-extrabold mt-4 mb-2 text-slate-900 dark:text-white">{parseInlineMarkdown(line.slice(3))}</h3>;
    }
    if (line.startsWith('# ')) {
      return <h2 key={i} className="text-base font-black mt-5 mb-2.5 text-slate-900 dark:text-white">{parseInlineMarkdown(line.slice(2))}</h2>;
    }
    if (line.startsWith('> ')) {
      return (
        <blockquote key={i} className="border-l-4 border-slate-300 dark:border-slate-700 pl-3 py-1 my-2 text-slate-500 italic">
          {parseInlineMarkdown(line.slice(2))}
        </blockquote>
      );
    }
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const content = line.trim().startsWith('- ') ? line.trim().slice(2) : line.trim().slice(2);
      return (
        <li key={i} className="list-disc list-inside ml-2 my-1 text-slate-750 dark:text-slate-300">
          {parseInlineMarkdown(content)}
        </li>
      );
    }
    const numberedMatch = line.trim().match(/^(\d+)\.\s(.*)/);
    if (numberedMatch) {
      return (
        <li key={i} className="list-decimal list-inside ml-2 my-1 text-slate-750 dark:text-slate-300">
          {parseInlineMarkdown(numberedMatch[2])}
        </li>
      );
    }
    if (!line.trim()) {
      return <div key={i} className="h-2" />;
    }
    return <p key={i} className="my-1.5">{parseInlineMarkdown(line)}</p>;
  });
};

// ─── Visual Action Badges ──────────────────────────────────────────────────────
const renderActionBadge = (action) => {
  const badgeMap = {
    listar_tarefas: {
      label: 'Consultou tarefas',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
    },
    listar_disciplinas: {
      label: 'Consultou disciplinas',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30'
    },
    buscar_tarefa_por_nome: {
      label: 'Buscou tarefa por nome',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      className: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-100 dark:border-purple-900/30'
    },
    criar_tarefa: {
      label: 'Criou nova tarefa',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
    },
    atualizar_status_tarefa: {
      label: 'Atualizou status da tarefa',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
    }
  };

  const config = badgeMap[action.type] || {
    label: `Ação: ${action.type}`,
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    className: 'bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400 border-slate-100 dark:border-slate-900/30'
  };

  return (
    <div key={action.type + '-' + Date.now()} className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-lg text-[10px] font-bold ${config.className}`}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};

const AiChatDrawer = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Olá! Sou seu Copiloto IA. Posso ajudar você a planejar roteiros de estudos detalhados e organizados para suas tarefas. Clique em **"Criar Atividade com IA"** para estruturar uma atividade ou fale comigo pelo chat!',
      timestamp: new Date()
    }
  ]);
  
  const [chatHistory, setChatHistory] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    titulo: '',
    subject_id: '',
    peso: 1
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  const chatEndRef = useRef(null);

  // Load subjects
  useEffect(() => {
    if (isOpen) {
      subjectService.getAll()
        .then(setSubjects)
        .catch(err => console.error('Erro ao buscar disciplinas no Copiloto:', err));
    }
  }, [isOpen]);

  // Reset history and state when closing/opening drawer
  useEffect(() => {
    if (!isOpen) {
      setChatHistory([]);
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: 'Olá! Sou seu Copiloto IA. Posso ajudar você a planejar roteiros de estudos detalhados e organizados para suas tarefas. Clique em **"Criar Atividade com IA"** para estruturar uma atividade ou fale comigo pelo chat!',
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isFormOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await crudApi.post('/agent/chat', {
        message: messageText,
        history: chatHistory
      });

      const executedActions = response.data.executedActions || [];
      const hasMutation = executedActions.some(act => 
        ['criar_tarefa', 'atualizar_status_tarefa'].includes(act.type)
      );

      if (hasMutation) {
        window.dispatchEvent(new CustomEvent('tasks-updated'));
      }

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.data.response,
        executedActions: executedActions,
        timestamp: new Date(),
        canCopy: true
      };

      setMessages(prev => [...prev, aiMsg]);

      // Update Gemini history
      const userPart = { role: 'user', parts: [{ text: messageText }] };
      const modelPart = { role: 'model', parts: [{ text: response.data.response }] };
      setChatHistory(prev => [...prev, userPart, modelPart]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Desculpe, ocorreu um erro ao processar sua solicitação. Verifique se o backend está ativo.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.subject_id) return;

    const selectedSub = subjects.find(s => s.id === formData.subject_id);
    const subName = selectedSub ? selectedSub.nome : 'Geral';

    const userMsgText = `Crie a seguinte tarefa:\nTítulo: ${formData.titulo}\nDisciplina: ${subName}\nPeso: ${formData.peso}`;

    const userMsg = {
      id: `user-form-${Date.now()}`,
      sender: 'user',
      text: `Criar atividade com IA:\n- **Título**: ${formData.titulo}\n- **Disciplina**: ${subName}\n- **Peso**: ${formData.peso}x`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsFormOpen(false);
    setIsLoading(true);

    try {
      const response = await crudApi.post('/agent/chat', {
        message: userMsgText,
        history: chatHistory
      });

      const executedActions = response.data.executedActions || [];
      const hasMutation = executedActions.some(act => 
        ['criar_tarefa', 'atualizar_status_tarefa'].includes(act.type)
      );

      if (hasMutation) {
        window.dispatchEvent(new CustomEvent('tasks-updated'));
      }

      const aiMsg = {
        id: `ai-form-${Date.now()}`,
        sender: 'ai',
        text: response.data.response,
        executedActions: executedActions,
        timestamp: new Date(),
        canCopy: true
      };

      setMessages(prev => [...prev, aiMsg]);
      
      // Update Gemini history
      const userPart = { role: 'user', parts: [{ text: userMsgText }] };
      const modelPart = { role: 'model', parts: [{ text: response.data.response }] };
      setChatHistory(prev => [...prev, userPart, modelPart]);

      // Reset form
      setFormData({ titulo: '', subject_id: '', peso: 1 });
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `err-form-${Date.now()}`,
        sender: 'ai',
        text: 'Desculpe, ocorreu um erro ao gerar a descrição da atividade com a IA.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDescription = (msgId, text) => {
    // Emit Custom Event to copy description to the open CreateTaskModal
    const event = new CustomEvent('copy-ai-description', { detail: text });
    window.dispatchEvent(event);

    setCopiedId(msgId);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <>
      {/* Backdrop overlay for smaller screens */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer Container */}
      <div className={`fixed inset-y-0 right-0 z-50 flex flex-col w-80 sm:w-[380px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800/80 shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-gray-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Copiloto IA</h3>
              <p className="text-[10px] font-semibold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Agente Ativo
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
            title="Recolher Painel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick Action Top Bar */}
        <div className="p-3 bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800/40 flex justify-center">
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7-7H5" />
            </svg>
            Criar Atividade com IA
          </button>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar dark:bg-slate-900/10">
          
          {/* Form inside chat drawer */}
          {isFormOpen && (
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm animate-in slide-in-from-top-4 duration-200 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-2">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">Nova Atividade IA</h4>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Título da Atividade</label>
                  <input
                    type="text"
                    required
                    value={formData.titulo}
                    onChange={e => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:ring-1.5 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Ex: Trabalho de Física Quântica"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Disciplina</label>
                  <select
                    required
                    value={formData.subject_id}
                    onChange={e => setFormData(prev => ({ ...prev, subject_id: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:ring-1.5 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="" disabled>Selecione...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Peso ({formData.peso}x)</label>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.peso}
                    onChange={e => setFormData(prev => ({ ...prev, peso: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:shadow-md hover:shadow-indigo-500/20 transition-all duration-200"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.795-3.488-.136L15.313 8.096 14 3l-8.982 11.795 3.488.136z" />
                  </svg>
                  Gerar com Agente
                </button>
              </form>
            </div>
          )}

          {/* Messages list */}
          {messages.map(msg => (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/20 dark:border-slate-800/30 shadow-sm'}`}>
                <div className="whitespace-pre-wrap break-words font-medium space-y-1">
                  {msg.sender === 'ai' ? renderMarkdown(msg.text) : renderMarkdown(msg.text)}
                </div>
              </div>
              
              {/* Tool Execution Action Badges */}
              {msg.sender === 'ai' && msg.executedActions && msg.executedActions.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {msg.executedActions.map(action => renderActionBadge(action))}
                </div>
              )}

              {/* Copy action below AI response bubble */}
              {msg.sender === 'ai' && msg.canCopy && (
                <button
                  onClick={() => handleCopyDescription(msg.id, msg.text)}
                  className={`mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all ${copiedId === msg.id ? 'border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400' : ''}`}
                >
                  {copiedId === msg.id ? (
                    <>
                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copiado!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-6 4h10m-5-5v10" />
                      </svg>
                      Copiar para o Formulário
                    </>
                  )}
                </button>
              )}
            </div>
          ))}

          {/* Typing Loading indicator */}
          {isLoading && (
            <div className="flex flex-col items-start max-w-[85%] mr-auto">
              <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200/20 dark:border-slate-800/30 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input prompt fixed at the bottom */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-gray-50/50 dark:bg-slate-900/50">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-1.5 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={isLoading ? 'Aguarde a IA...' : 'Pergunte ao Agente...'}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 disabled:from-slate-300 disabled:to-slate-400 disabled:dark:from-slate-800 disabled:dark:to-slate-800 text-white rounded-xl hover:shadow-md hover:shadow-indigo-500/20 active:translate-y-0.5 transition-all"
            >
              <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
        
      </div>
    </>
  );
};

export default AiChatDrawer;
