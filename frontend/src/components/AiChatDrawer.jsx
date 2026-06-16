import React, { useState, useEffect, useRef } from 'react';
import { crudApi } from '../services/api';
import subjectService from '../services/subjectService';
import { useAuth } from '../context/AuthContext';

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
    },
    excluir_tarefa: {
      label: 'Excluiu tarefa',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
    },
    criar_disciplina: {
      label: 'Criou disciplina',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
      className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
    },
    atualizar_disciplina: {
      label: 'Atualizou disciplina',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
    },
    excluir_disciplina: {
      label: 'Excluiu disciplina',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
    },
    atualizar_tarefa: {
      label: 'Atualizou tarefa',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
    },
    obter_configuracoes_perfil: {
      label: 'Consultou configurações de perfil',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
    },
    atualizar_configuracoes_perfil: {
      label: 'Atualizou perfil',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
    },
    analisar_historico_produtividade: {
      label: 'Analisou produtividade',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30'
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

// ─── Quick Action Chip Definitions ─────────────────────────────────────────────
const QUICK_ACTION_CHIPS = [
  { id: 'qa-1', label: 'Listar Atividades Ativas', icon: '📋' },
  { id: 'qa-2', label: 'Criar uma Tarefa', icon: '➕' },
  { id: 'qa-3', label: 'Faça um resumo de matéria para mim', icon: '📝' },
  { id: 'qa-4', label: 'Verifica a data de entrega das atividades para mim', icon: '📅' },
  { id: 'qa-5', label: 'Verifique a data que eu criei essa tarefa', icon: '🕐' },
];

const AiChatDrawer = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  
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
  const [isUploading, setIsUploading] = useState(false);
  
  const [uploadBuffer, setUploadBuffer] = useState([]);
  const [customTimeMode, setCustomTimeMode] = useState(false);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const getDefaultWelcomeMessage = () => [{
    id: 'welcome',
    sender: 'ai',
    text: 'Olá! 👋 Sou seu **Copiloto IA**. Posso te ajudar a gerenciar suas tarefas, criar atividades, resumir matérias e muito mais. Use os atalhos abaixo ou digite sua pergunta!',
    timestamp: new Date()
  }];

  // 1. Session Isolation: load user-scoped data or clear on logout
  useEffect(() => {
    if (user?.id) {
      const sessionsKey = `edutrack_ai_sessions_${user.id}`;
      const activeIdKey = `edutrack_ai_active_id_${user.id}`;
      
      const savedSessions = localStorage.getItem(sessionsKey);
      let loadedSessions = [];
      if (savedSessions) {
        try {
          loadedSessions = JSON.parse(savedSessions);
          setSessions(loadedSessions);
        } catch (e) {
          setSessions([]);
        }
      } else {
        setSessions([]);
      }

      const savedActiveId = localStorage.getItem(activeIdKey);
      if (savedActiveId && loadedSessions.some(s => s.id === savedActiveId)) {
        setActiveSessionId(savedActiveId);
        const activeSession = loadedSessions.find(s => s.id === savedActiveId);
        setMessages(activeSession.messages || getDefaultWelcomeMessage());
        setChatHistory(activeSession.chatHistory || []);
      } else {
        const newId = `session-${Date.now()}`;
        setActiveSessionId(newId);
        setMessages(getDefaultWelcomeMessage());
        setChatHistory([]);
      }
    } else {
      // 2. Wipe on Logout: clear state immediately
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
      setChatHistory([]);
    }
  }, [user?.id]);

  const loadSubjects = () => {
    subjectService.getAll()
      .then(setSubjects)
      .catch(err => console.error('Erro ao buscar disciplinas no Copiloto:', err));
  };

  // Load subjects
  useEffect(() => {
    if (isOpen) {
      loadSubjects();
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isFormOpen]);

  const saveCurrentSession = (currentMessages, currentHistory) => {
    if (!user?.id || !activeSessionId) return;

    // Don't save empty default session
    const hasUserMessage = currentMessages.some(m => m.sender === 'user');
    if (!hasUserMessage) return;

    // Generate title from first user message
    let title = 'Nova Conversa';
    const firstUserMsg = currentMessages.find(m => m.sender === 'user');
    if (firstUserMsg) {
      title = firstUserMsg.text.length > 25 ? firstUserMsg.text.slice(0, 25) + '...' : firstUserMsg.text;
    }

    setSessions(prev => {
      const newSessions = [...prev];
      const idx = newSessions.findIndex(s => s.id === activeSessionId);
      const sessionData = {
        id: activeSessionId,
        title,
        messages: currentMessages,
        chatHistory: currentHistory,
        updatedAt: new Date().toISOString()
      };
      if (idx >= 0) {
        newSessions[idx] = sessionData;
      } else {
        newSessions.unshift(sessionData);
      }
      localStorage.setItem(`edutrack_ai_sessions_${user.id}`, JSON.stringify(newSessions));
      return newSessions;
    });
  };

  const handleNewConversation = () => {
    const newId = `session-${Date.now()}`;
    setActiveSessionId(newId);
    setMessages(getDefaultWelcomeMessage());
    setChatHistory([]);
    if (user?.id) {
      localStorage.setItem(`edutrack_ai_active_id_${user.id}`, newId);
    }
  };

  const handleDeleteSession = (sessionId) => {
    if (!user?.id) return;
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      localStorage.setItem(`edutrack_ai_sessions_${user.id}`, JSON.stringify(updated));
      
      if (sessionId === activeSessionId) {
        const newId = `session-${Date.now()}`;
        setActiveSessionId(newId);
        setMessages(getDefaultWelcomeMessage());
        setChatHistory([]);
        localStorage.setItem(`edutrack_ai_active_id_${user.id}`, newId);
      }
      return updated;
    });
  };

  const sendMessage = async (messageText, isSilent = false, displayText = null) => {
    if (!messageText.trim()) return;

    let nextMessages = messages;
    if (!isSilent) {
      const userMsg = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: displayText || messageText,
        timestamp: new Date()
      };
      nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      saveCurrentSession(nextMessages, chatHistory);
    }
    
    setIsLoading(true);

    try {
      const response = await crudApi.post('/agent/chat', {
        message: messageText,
        history: chatHistory,
        userDateTime: new Date().toISOString()
      });

      const executedActions = response.data.executedActions || [];
      const hasMutation = executedActions.some(act => 
        [
          'criar_tarefa', 
          'atualizar_status_tarefa', 
          'excluir_tarefa',
          'criar_disciplina',
          'atualizar_disciplina',
          'excluir_disciplina',
          'atualizar_tarefa',
          'atualizar_configuracoes_perfil'
        ].includes(act.type)
      );

      if (hasMutation) {
        window.dispatchEvent(new CustomEvent('tasks-updated'));
        loadSubjects();
      }

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.data.response,
        executedActions: executedActions,
        timestamp: new Date(),
        canCopy: true
      };

      const finalMessages = [...nextMessages, aiMsg];
      setMessages(finalMessages);

      // Update Gemini history
      const userPart = { role: 'user', parts: [{ text: messageText }] };
      const modelPart = { role: 'model', parts: [{ text: response.data.response }] };
      const nextHistory = [...chatHistory, userPart, modelPart];
      setChatHistory(nextHistory);
      
      saveCurrentSession(finalMessages, nextHistory);

    } catch (err) {
      console.error(err);
      const errMsg = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Desculpe, ocorreu um erro ao processar sua solicitação. Verifique se o backend está ativo.',
        timestamp: new Date()
      };
      const finalMessages = [...nextMessages, errMsg];
      setMessages(finalMessages);
      saveCurrentSession(finalMessages, chatHistory);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && uploadBuffer.length === 0) return;

    setCustomTimeMode(false);
    const userText = inputText;
    setInputText('');

    if (uploadBuffer.length > 0) {
      setIsUploading(true);
      const filesToUpload = [...uploadBuffer];
      setUploadBuffer([]);

      let metadataList = [];
      
      const uploadMsgId = `upload-status-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: uploadMsgId,
        sender: 'ai',
        text: `Enviando ${filesToUpload.length} arquivo(s)...`,
        timestamp: new Date(),
        isUploadingStatus: true,
        uploadStatus: 'loading'
      }]);

      try {
        for (const file of filesToUpload) {
          const formData = new FormData();
          formData.append('file', file);
          const res = await crudApi.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          metadataList.push(res.data);
        }
        
        setMessages(prev => prev.map(m => m.id === uploadMsgId ? {
          ...m,
          text: `Arquivos enviados com sucesso! 📎`,
          uploadStatus: 'success'
        } : m));

      } catch(err) {
        console.error('Upload falhou', err);
        setMessages(prev => prev.map(m => m.id === uploadMsgId ? {
          ...m,
          text: `Falha ao enviar alguns arquivos.`,
          uploadStatus: 'error'
        } : m));
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      if (metadataList.length > 0) {
        const fileMetadataMessage = `[Upload de Arquivo: ${JSON.stringify(metadataList)}]`;
        let displayMsg = `📎 Anexou ${metadataList.length} arquivo(s):\n${metadataList.map(m => `- \`${m.file_name}\``).join('\n')}`;
        if (userText) {
          displayMsg += `\n\n${userText}`;
        }
        await sendMessage(userText ? `${fileMetadataMessage}\n\n${userText}` : fileMetadataMessage, false, displayMsg);
        return;
      }
    }

    if (userText) {
      sendMessage(userText);
    }
  };

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadBuffer(prev => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.subject_id) return;

    const selectedSub = subjects.find(s => s.id === formData.subject_id);
    const subName = selectedSub ? selectedSub.nome : 'Geral';

    const userMsgText = `Crie a seguinte tarefa:\nTítulo: ${formData.titulo}\nDisciplina: ${subName}\nPeso: ${formData.peso}`;
    const displayText = `Criar atividade com IA:\n- **Título**: ${formData.titulo}\n- **Disciplina**: ${subName}\n- **Peso**: ${formData.peso}x`;

    setIsFormOpen(false);
    await sendMessage(userMsgText, false, displayText);

    // Reset form
    setFormData({ titulo: '', subject_id: '', peso: 1 });
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

  const handleChipClick = (chip) => {
    if (chip.id === 'qa-1') {
      sendMessage("Liste as minhas tarefas pendentes ou em andamento", false, "Listar Atividades Ativas");
    } else if (chip.id === 'qa-2') {
      sendMessage("Quero criar uma nova tarefa. Por favor, inicie o roteiro de entrevista me perguntando o Título da atividade.", false, "Criar uma tarefa");
    } else {
      sendMessage(chip.label);
    }
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

        {/* Action Panel: Nova Conversa & Histórico */}
        <div className="border-b border-slate-150 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20">
          {/* New Conversation Button */}
          <div className="p-3">
            <button 
              onClick={handleNewConversation} 
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              + Nova Conversa
            </button>
          </div>

          {/* Collapsible History Section */}
          <div className="border-t border-slate-100 dark:border-slate-800/60">
            <button 
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-extrabold text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/35 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Histórico de Conversas ({sessions.length})
              </span>
              <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isHistoryExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            
            {isHistoryExpanded && (
              <div className="max-h-48 overflow-y-auto px-3 py-2 bg-slate-100/30 dark:bg-slate-900/30 space-y-1.5 custom-scrollbar border-t border-slate-100 dark:border-slate-800/40">
                {sessions.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-3">Nenhuma conversa salva.</p>
                ) : (
                  sessions.map(s => (
                    <div 
                      key={s.id} 
                      className={`flex items-center justify-between group p-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${s.id === activeSessionId ? 'bg-indigo-50/50 dark:bg-indigo-950/25 border-indigo-150 dark:border-indigo-900/35 text-indigo-750 dark:text-indigo-400' : 'bg-white dark:bg-slate-800/40 border-slate-200/55 dark:border-slate-800/55 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-355'}`}
                      onClick={() => {
                        setActiveSessionId(s.id);
                        setMessages(s.messages || []);
                        setChatHistory(s.chatHistory || []);
                        if (user?.id) {
                          localStorage.setItem(`edutrack_ai_active_id_${user.id}`, s.id);
                        }
                      }}
                    >
                      <div className="truncate flex-1 pr-2">
                        <p className="truncate font-bold">{s.title}</p>
                        <p className="text-[9px] text-slate-450 font-medium">
                          {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(s.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-250 dark:hover:bg-slate-750 transition-all cursor-pointer"
                        title="Excluir conversa"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
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
          {messages.map((msg, msgIndex) => (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              {msg.isUploadingStatus ? (
                <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed border shadow-sm rounded-tl-none flex items-center gap-2.5 ${
                  msg.uploadStatus === 'loading' 
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800/50 text-slate-550' 
                    : msg.uploadStatus === 'success' 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400' 
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100/50 dark:border-rose-900/30 text-rose-800 dark:text-rose-455'
                }`}>
                  {msg.uploadStatus === 'loading' && (
                    <svg className="animate-spin h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {msg.uploadStatus === 'success' && (
                    <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {msg.uploadStatus === 'error' && (
                    <svg className="h-4 w-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  <span className="font-semibold">{msg.text}</span>
                </div>
              ) : (
                <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/20 dark:border-slate-800/30 shadow-sm'}`}>
                  <div className="whitespace-pre-wrap break-words font-medium space-y-1">
                    {msg.sender === 'ai' ? renderMarkdown(msg.text) : renderMarkdown(msg.text)}
                  </div>
                </div>
              )}
              
              {/* Tool Execution Action Badges */}
              {msg.sender === 'ai' && msg.executedActions && msg.executedActions.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {msg.executedActions.map(action => renderActionBadge(action))}
                </div>
              )}

              {/* Dynamic Action responses: Subject Chips & interactive Task Cards */}
              {msg.sender === 'ai' && msg.executedActions && msg.executedActions.map(action => {
                if (action.type === 'listar_disciplinas' && action.data && action.data.disciplinas) {
                  return (
                    <div key="subject-chips" className="mt-2.5 flex flex-wrap gap-2 animate-in fade-in duration-200">
                      {action.data.disciplinas.map(sub => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => sendMessage(sub.nome)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/50 dark:hover:bg-indigo-950/60 border border-slate-200/60 dark:border-slate-850 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                        >
                          📚 {sub.nome}
                        </button>
                      ))}
                    </div>
                  );
                }
                
                if (['listar_tarefas', 'buscar_tarefa_por_nome'].includes(action.type) && action.data && action.data.tarefas) {
                  return (
                    <div key={`${action.type}-task-cards`} className="mt-3 w-full space-y-2.5 animate-in fade-in duration-200">
                      {action.data.tarefas.map(t => {
                        const isExpanded = expandedTaskId === t.id;
                        const statusEmojis = {
                          pendente: '⏳',
                          em_andamento: '🔄',
                          concluida: '✅',
                          atrasada: '🔴',
                          bloqueada: '🔒'
                        };
                        const statusColors = {
                          pendente: 'text-slate-550 bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:text-slate-405',
                          em_andamento: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400',
                          concluida: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400',
                          atrasada: 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400',
                          bloqueada: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400'
                        };
                        
                        return (
                          <div 
                            key={t.id}
                            className={`p-3 rounded-2xl border transition-all ${isExpanded ? 'bg-indigo-50/25 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-850 shadow-md' : 'bg-white dark:bg-slate-800/50 border-slate-150 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-250 dark:hover:border-slate-700/80 shadow-sm'}`}
                          >
                            {/* Card Header clickable to expand */}
                            <div 
                              className="flex items-start justify-between cursor-pointer"
                              onClick={() => setExpandedTaskId(isExpanded ? null : t.id)}
                            >
                              <div className="flex-1 pr-2 min-w-0">
                                <h5 className="text-[11px] font-bold text-slate-800 dark:text-white truncate">{t.titulo}</h5>
                                <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold mt-0.5">📚 {t.disciplina}</p>
                              </div>
                              <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase tracking-wide flex items-center gap-1 shrink-0 ${statusColors[t.status] || statusColors.pendente}`}>
                                <span>{statusEmojis[t.status] || '⏳'}</span>
                                <span className="hidden xs:inline">{t.status.replace('_', ' ')}</span>
                              </span>
                            </div>

                            {/* Date, Priority, etc. details */}
                            <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 dark:text-slate-450 mt-2">
                              {t.data_prevista && (
                                <span className="flex items-center gap-1">
                                  📅 Entrega: {new Date(t.data_prevista).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                              <span>⚖️ Peso: {t.peso}x</span>
                            </div>

                            {/* Actions panel if expanded */}
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 duration-150">
                                <button 
                                  onClick={() => sendMessage(`Mudar status da tarefa "${t.titulo}" para "concluida"`, false, `Concluir atividade: ${t.titulo}`)}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-705 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  ✅ Concluir
                                </button>
                                <button 
                                  onClick={() => sendMessage(`Mudar status da tarefa "${t.titulo}" para "em_andamento"`, false, `Iniciar atividade: ${t.titulo}`)}
                                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-705 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 border border-blue-100 dark:border-blue-900/50 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  🔄 Iniciar
                                </button>
                                <button 
                                  onClick={() => sendMessage(`Verificar os detalhes e descrição da tarefa "${t.titulo}"`, false, `Ver detalhes: ${t.titulo}`)}
                                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-705 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  🔍 Ver Detalhes
                                </button>
                                <button 
                                  onClick={() => sendMessage(`Excluir a tarefa "${t.titulo}"`, false, `Excluir atividade: ${t.titulo}`)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-705 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 border border-rose-100 dark:border-rose-900/50 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  🗑️ Excluir
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              })}

              {/* Copy action below AI response bubble */}
              {msg.sender === 'ai' && msg.canCopy && (
                <button
                  onClick={() => handleCopyDescription(msg.id, msg.text)}
                  className={`mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all ${copiedId === msg.id ? 'border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400' : ''}`}
                >
                  {copiedId === msg.id ? (
                    <>
                      <svg className="w-3 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
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

              {/* Quick Action Chips — show after the welcome message when chat is fresh */}
              {msg.id === 'welcome' && messages.length <= 1 && !isLoading && (
                <div className="mt-3 grid grid-cols-1 gap-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {QUICK_ACTION_CHIPS.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className="group flex items-center gap-2.5 px-3.5 py-2.5 bg-white dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-350 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-indigo-500/5 hover:-translate-y-0.5 active:translate-y-0 text-left"
                    >
                      <span className="text-sm flex-shrink-0 group-hover:scale-110 transition-transform">{chip.icon}</span>
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
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
          
          {/* Staging Area for Uploads */}
          {uploadBuffer.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {uploadBuffer.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="truncate max-w-[120px] font-medium text-slate-700 dark:text-slate-350">{f.name}</span>
                  <button type="button" onClick={() => setUploadBuffer(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500 ml-0.5 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Restrictive Chips Area */}
          {(() => {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.sender === 'ai' && !isLoading) {
              const textLower = lastMsg.text.toLowerCase();
              const isWeight = textLower.includes('escala de 1 a 10') || textLower.includes('valor da nota');
              const isTime = textLower.includes('quantos minutos') || textLower.includes('tempo estimado') || textLower.includes('foco');

              if (isWeight) {
                return (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {[1,2,3,4,5,6,7,8,9,10].map(val => (
                      <button key={val} type="button" onClick={() => sendMessage(val.toString())} className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-colors">
                        {val}
                      </button>
                    ))}
                  </div>
                );
              }

              if (isTime && !customTimeMode) {
                return (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[30, 60, 90, 120].map(val => (
                      <button key={val} type="button" onClick={() => sendMessage(val.toString())} className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-colors">
                        {val} min
                      </button>
                    ))}
                    <button type="button" onClick={() => setCustomTimeMode(true)} className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                      + Personalizado
                    </button>
                  </div>
                );
              }
            }
            return null;
          })()}

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="relative flex-1 flex items-center">
              {/* Paperclip Button */}
              <button
                type="button"
                onClick={handlePaperclipClick}
                disabled={isLoading || isUploading}
                className="absolute left-3 p-1.5 text-slate-450 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Anexar arquivo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 0l-3.536 3.536m3.536-3.536L13.5 13.5m-6-6l-3.536 3.536m0 0a5 5 0 007.072 7.072l.53-.53m-5.111-5.111l4.075-4.075M8.5 8.5L6.5 10.5" />
                </svg>
              </button>
              
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-1.5 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-70"
                placeholder={isLoading ? 'Aguarde a IA...' : isUploading ? 'Enviando arquivos...' : 'Pergunte ao Agente...'}
                disabled={isLoading || isUploading || (() => {
                  const lastMsg = messages[messages.length - 1];
                  if (!lastMsg || lastMsg.sender !== 'ai' || isLoading) return false;
                  const textLower = lastMsg.text.toLowerCase();
                  if (textLower.includes('escala de 1 a 10') || textLower.includes('valor da nota')) return true;
                  if ((textLower.includes('quantos minutos') || textLower.includes('tempo estimado')) && !customTimeMode) return true;
                  return false;
                })()}
              />
              
              {/* Hidden file input */}
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || isUploading || (!inputText.trim() && uploadBuffer.length === 0)}
              className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 disabled:from-slate-300 disabled:to-slate-400 disabled:dark:from-slate-800 disabled:dark:to-slate-800 text-white rounded-xl hover:shadow-md hover:shadow-indigo-500/20 active:translate-y-0.5 transition-all cursor-pointer"
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
