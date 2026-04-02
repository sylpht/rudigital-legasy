import React, { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';
import { 
  Plus, CheckSquare, Square, Trash2, LayoutDashboard, Moon, Sun, 
  Filter, FilterX, Cloud, CloudOff, Palette, Search, Copy, Edit2, GripVertical, Trash, Columns, User, Download, Upload
} from 'lucide-react';

// === НАСТРОЙКИ FIREBASE ===
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const firebaseApp = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// === КОМАНДА (МУЛЬТИАККАУНТ) ===
const TEAM = [
  { id: 'u1', name: 'Иван (Ты)', initials: 'ИВ', color: 'bg-blue-500' },
  { id: 'u2', name: 'Наталья', initials: 'НТ', color: 'bg-purple-500' },
  { id: 'u3', name: 'Никита', initials: 'НК', color: 'bg-emerald-500' },
  { id: 'u4', name: 'Дизайнер', initials: 'ДЗ', color: 'bg-rose-500' },
];

// === ИСХОДНЫЕ ДАННЫЕ ===
const initialData = [
  { id: 1, title: 'Документы и продажи', items: [
      { id: '1-1', text: 'Делать Кп', checked: false, status: 'todo' },
      { id: '1-2', text: 'Выставлять счета', checked: false, status: 'todo' },
      { id: '1-3', text: 'УПД', checked: false, status: 'todo' },
      { id: '1-4', text: 'Заявка на отгрузку', checked: false, status: 'todo' },
      { id: '1-5', text: 'КП+Каталог', checked: false, status: 'todo' },
  ]},
  { id: 2, title: 'Связь', items: [
      { id: '2-1', text: 'Телефон', checked: false, status: 'todo' },
      { id: '2-2', text: 'Переадресация', checked: false, status: 'todo' },
      { id: '2-3', text: 'Почта+сбор', checked: false, status: 'todo' },
  ]},
  { id: 3, title: 'Соцсети', items: [
      { id: '3-1', text: 'Вк', checked: false, status: 'todo' },
      { id: '3-2', text: 'Инста', checked: false, status: 'todo' },
      { id: '3-3', text: 'Тг', checked: false, status: 'todo' },
      { id: '3-4', text: 'Дзен', checked: false, status: 'todo' },
      { id: '3-5', text: 'Тредсы', checked: false, status: 'todo' },
  ]},
  { id: 4, title: 'Проекты', items: [
      { id: '4-1', text: 'Маглинк', checked: false, status: 'todo' },
      { id: '4-2', text: 'Металлхаут', checked: false, status: 'todo' },
  ]},
  { id: 5, title: 'Люди и встречи', items: [
      { id: '5-1', text: 'Наталья', checked: false, status: 'todo' },
      { id: '5-2', text: 'История', checked: false, status: 'todo' },
      { id: '5-3', text: 'Никита', checked: false, status: 'todo' },
      { id: '5-4', text: 'Кофемания', checked: false, status: 'todo' },
  ]},
  { id: 6, title: 'Партнеры', items: [
      { id: '6-1', text: 'Дилеры', checked: false, status: 'todo' },
      { id: '6-2', text: 'Обучение', checked: false, status: 'todo' },
      { id: '6-3', text: 'КП', checked: false, status: 'todo' },
      { id: '6-4', text: 'Звонки', checked: false, status: 'todo' },
  ]},
  { id: 7, title: 'Производство', items: [
      { id: '7-1', text: 'Этикетки', checked: false, status: 'todo' },
      { id: '7-2', text: 'Банки', checked: false, status: 'todo' },
      { id: '7-3', text: 'Сертификаты', checked: false, status: 'todo' },
  ]},
  { id: 8, title: 'Объекты', items: [
      { id: '8-1', text: 'Кухни', checked: false, status: 'todo' },
      { id: '8-2', text: 'Скульптуры', checked: false, status: 'todo' },
      { id: '8-3', text: 'Столы', checked: false, status: 'todo' },
      { id: '8-4', text: 'Стены', checked: false, status: 'todo' },
      { id: '8-5', text: 'Шкафы', checked: false, status: 'todo' },
  ]}
];

const colorStyles = {
  default: 'bg-transparent text-slate-700 dark:text-slate-300 border-transparent hover:border-slate-200 dark:hover:border-slate-600',
  red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/50',
  green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50',
};

// === КОМПОНЕНТ КОНФЕТТИ ===
const Confetti = memo(() => {
  const pieces = Array.from({ length: 120 });
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map((_, i) => (
        <div key={i} className="confetti-piece" style={{
          left: `${Math.random() * 100}%`,
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          animationDelay: `${Math.random() * 1.5}s`,
          animationDuration: `${2 + Math.random() * 2}s`,
          width: `${6 + Math.random() * 6}px`, height: `${10 + Math.random() * 10}px`,
        }} />
      ))}
    </div>
  );
});

// === ОПТИМИЗИРОВАННАЯ ЗАДАЧА ДЛЯ СЕТКИ (Изолированный стейт редактирования) ===
const GridTaskItem = memo(({ item, sectionId, onToggle, onDelete, onEdit, onColorCycle, onAssignCycle, onDropItem }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.text);
  const assigneeData = TEAM.find(t => t.id === item.assignee);

  useEffect(() => setEditValue(item.text), [item.text]);

  const saveEdit = () => {
    if (editValue.trim() && editValue !== item.text) onEdit(sectionId, item.id, editValue.trim());
    setIsEditing(false);
  };

  return (
    <li 
      draggable 
      onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ srcSecId: sectionId, srcItemId: item.id }))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDropItem(e, item.id)}
      className={`flex items-start gap-1 group p-2 rounded-lg border transition-all ${colorStyles[item.color || 'default']} hover:shadow-sm relative`}
    >
      <div className="mt-0.5 opacity-0 group-hover:opacity-100 cursor-move text-slate-300 hover:text-slate-500 transition-opacity">
        <GripVertical size={16} />
      </div>

      <button onClick={() => onToggle(sectionId, item.id)} className={`mt-0.5 flex-shrink-0 transition-colors ${item.checked ? 'text-blue-500 dark:text-blue-400' : 'text-slate-300 hover:text-slate-400 dark:text-slate-500 dark:hover:text-slate-400'}`}>
        {item.checked ? <CheckSquare size={18} /> : <Square size={18} />}
      </button>
      
      <div className="flex-1 text-sm pt-0.5 overflow-hidden ml-1 flex flex-col">
        {isEditing ? (
          <input 
            autoFocus type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit} onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
            className="w-full bg-white dark:bg-slate-900 border border-blue-500 rounded px-2 py-0.5 outline-none text-slate-800 dark:text-slate-200"
          />
        ) : (
          <span onDoubleClick={() => setIsEditing(true)} className={`block w-full cursor-text transition-all ${item.checked ? 'text-slate-400 dark:text-slate-500 line-through opacity-60' : ''}`} style={{ wordBreak: 'break-word' }}>
            {item.text}
          </span>
        )}
      </div>

      {assigneeData && (
        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm ${assigneeData.color}`} title={assigneeData.name}>
          {assigneeData.initials}
        </div>
      )}

      <div className="flex items-center absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity p-1 gap-1">
        <button onClick={() => onAssignCycle(sectionId, item.id)} className="p-1 text-slate-400 hover:text-blue-500 transition-colors" title="Назначить"><User size={14} /></button>
        <button onClick={() => onColorCycle(sectionId, item.id)} className="p-1 text-slate-400 hover:text-yellow-500 transition-colors" title="Приоритет"><Palette size={14} /></button>
        <button onClick={() => setIsEditing(true)} className="p-1 text-slate-400 hover:text-green-500 transition-colors" title="Правка"><Edit2 size={14} /></button>
        <button onClick={() => onDelete(sectionId, item.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Удалить"><Trash2 size={14} /></button>
      </div>
    </li>
  );
});

// === ОПТИМИЗИРОВАННАЯ КАРТОЧКА СЕКЦИИ ===
const SectionCard = memo(({ section, hideCompleted, searchQuery, onToggle, onDelete, onAdd, onEdit, onColorCycle, onAssignCycle, onMove }) => {
  const [inputValue, setInputValue] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Кэшируем вычисление видимых задач
  const visibleItems = useMemo(() => {
    return section.items
      .filter(i => hideCompleted ? !i.checked : true)
      .filter(i => searchQuery ? i.text.toLowerCase().includes(searchQuery.toLowerCase()) : true)
      .sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1));
  }, [section.items, hideCompleted, searchQuery]);

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    onAdd(section.id, inputValue.trim());
    setInputValue('');
  };

  const handleDropOnSection = useCallback((e) => {
    e.preventDefault(); setIsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onMove(data.srcSecId, data.srcItemId, section.id, null);
    } catch(err) {}
  }, [onMove, section.id]);

  const handleDropOnItem = useCallback((e, targetItemId) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onMove(data.srcSecId, data.srcItemId, section.id, targetItemId);
    } catch(err) {}
  }, [onMove, section.id]);

  return (
    <div 
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border overflow-hidden flex flex-col max-h-[500px] transition-all duration-200 ${isDragOver ? 'border-blue-400 dark:border-blue-500 shadow-md ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDropOnSection}
    >
      <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center transition-colors">
        <h2 className="font-semibold text-slate-800 dark:text-slate-200">Секция {section.id}: {section.title}</h2>
        <span className="text-xs font-medium px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
          {section.items.filter(i => i.checked).length} / {section.items.length}
        </span>
      </div>

      <div className="p-3 flex-1 overflow-y-auto custom-scrollbar relative">
        <ul className="space-y-1.5 min-h-[50px]">
          {visibleItems.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Нет задач</p>
          ) : (
            visibleItems.map(item => (
              <GridTaskItem 
                key={item.id} item={item} sectionId={section.id}
                onToggle={onToggle} onDelete={onDelete} onEdit={onEdit}
                onColorCycle={onColorCycle} onAssignCycle={onAssignCycle} onDropItem={handleDropOnItem}
              />
            ))
          )}
        </ul>
      </div>

      <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 mt-auto transition-colors">
        <div className="flex items-center gap-2">
          <input
            type="text" placeholder="Добавить пункт..." value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 text-sm bg-white dark:bg-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
          />
          <button onClick={handleAdd} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors flex-shrink-0 shadow-sm">
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
});

// === ОПТИМИЗИРОВАННАЯ ЗАДАЧА КАНБАНА ===
const KanbanTaskItem = memo(({ item, onToggle, onAssignCycle, onColorCycle }) => {
  const assigneeData = TEAM.find(t => t.id === item.assignee);
  return (
    <div 
      draggable
      onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ srcSecId: item.secId, srcItemId: item.id }))}
      className={`bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group ${colorStyles[item.color || 'default']}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full line-clamp-1">
          {item.secTitle}
        </span>
        <div className="flex gap-1">
          <button onClick={() => onColorCycle(item.secId, item.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-yellow-500 transition-opacity"><Palette size={14} /></button>
          <button onClick={() => onAssignCycle(item.secId, item.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500 transition-opacity"><User size={14} /></button>
        </div>
      </div>
      
      <div className="flex gap-2 items-start">
        <button onClick={() => onToggle(item.secId, item.id)} className={`mt-0.5 ${item.checked ? 'text-blue-500' : 'text-slate-300'}`}>
          {item.checked ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>
        <span className={`text-sm ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{item.text}</span>
      </div>

      {assigneeData && (
        <div className="mt-3 flex justify-end">
           <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm ${assigneeData.color}`} title={assigneeData.name}>
            {assigneeData.initials}
          </div>
        </div>
      )}
    </div>
  );
});

// === ОПТИМИЗИРОВАННАЯ КОЛОНКА КАНБАНА ===
const KanbanColumn = memo(({ status, title, items, onStatusChange, onToggle, onAssignCycle, onColorCycle }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onStatusChange(data.srcSecId, data.srcItemId, status);
    } catch(err) {}
  }, [onStatusChange, status]);

  return (
    <div 
      className={`flex flex-col bg-slate-100/50 dark:bg-slate-800/30 rounded-xl p-3 border-2 transition-colors min-h-[500px] ${isDragOver ? 'border-blue-400 bg-blue-50/30 dark:bg-blue-900/20' : 'border-transparent'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="font-bold text-slate-700 dark:text-slate-200">{title}</h3>
        <span className="text-xs bg-white dark:bg-slate-700 px-2 py-1 rounded-full text-slate-500 dark:text-slate-400 shadow-sm">{items.length}</span>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {items.map(item => (
          <KanbanTaskItem 
            key={`${item.secId}-${item.id}`} item={item} 
            onToggle={onToggle} onAssignCycle={onAssignCycle} onColorCycle={onColorCycle} 
          />
        ))}
      </div>
    </div>
  );
});

// === ОСНОВНОЙ КОМПОНЕНТ APP ===
export default function App() {
  const [sections, setSections] = useState(initialData);
  const [isDark, setIsDark] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState(firebaseApp ? 'local' : 'disabled'); 

  const prevCompletedSections = useRef([]);
  const prevProgress = useRef(0);
  const fileInputRef = useRef(null);

  // Инициализация
  useEffect(() => {
    try {
      if (localStorage.getItem('dashThemeDark') === 'true') setIsDark(true);
      if (localStorage.getItem('dashViewMode')) setViewMode(localStorage.getItem('dashViewMode'));
      const savedData = localStorage.getItem('myDashboardData');
      if (savedData) setSections(JSON.parse(savedData));
    } catch (e) {}
  }, []);

  // Firebase Auth & Sync
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (err) {}
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    setSyncStatus('syncing');
    const unsubscribe = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'dashboard', 'state'), (docSnap) => {
      if (docSnap.exists()) { setSections(docSnap.data().sections); setSyncStatus('synced'); }
      else { setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'dashboard', 'state'), { sections }).then(() => setSyncStatus('synced')); }
    }, () => setSyncStatus('error'));
    return () => unsubscribe();
  }, [user]);

  const updateState = useCallback((updater) => {
    setSections(prev => {
      const newSections = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('myDashboardData', JSON.stringify(newSections));
      if (user && db) {
        setSyncStatus('syncing');
        setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'dashboard', 'state'), { sections: newSections })
          .then(() => setSyncStatus('synced')).catch(() => setSyncStatus('error'));
      }
      return newSections;
    });
  }, [user]);

  // Кэшированные вычисления статистики (ОПТИМИЗАЦИЯ)
  const progressStats = useMemo(() => {
    let total = 0; let completed = 0;
    sections.forEach(s => { total += s.items.length; completed += s.items.filter(i => i.checked).length; });
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percent };
  }, [sections]);

  // Кэшированные данные для Канбана (ОПТИМИЗАЦИЯ)
  const kanbanData = useMemo(() => {
    const items = sections.flatMap(sec => 
      sec.items.map(item => ({
        ...item, secId: sec.id, secTitle: sec.title, status: item.status || (item.checked ? 'done' : 'todo') 
      }))
    ).filter(i => searchQuery ? i.text.toLowerCase().includes(searchQuery.toLowerCase()) : true)
     .filter(i => hideCompleted ? !i.checked : true);

    return {
      todo: items.filter(i => i.status === 'todo'),
      inProgress: items.filter(i => i.status === 'in-progress'),
      done: items.filter(i => i.status === 'done')
    };
  }, [sections, searchQuery, hideCompleted]);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  }, []);

  // Логика запуска конфетти
  useEffect(() => {
    if (progressStats.percent === 100 && prevProgress.current < 100 && progressStats.total > 0) {
      triggerConfetti();
    }
    prevProgress.current = progressStats.percent;

    const completedSectionIds = sections
      .filter(s => s.items.length > 0 && s.items.every(i => i.checked))
      .map(s => s.id);
    
    const newCompletions = completedSectionIds.filter(id => !prevCompletedSections.current.includes(id));
    if (newCompletions.length > 0 && progressStats.percent < 100) {
      triggerConfetti();
    }
    prevCompletedSections.current = completedSectionIds;
  }, [sections, progressStats.percent, progressStats.total, triggerConfetti]);

  // Экшены управления состоянием
  const toggleItem = useCallback((secId, itemId) => {
    updateState(prev => prev.map(sec => sec.id === secId ? {
      ...sec, items: sec.items.map(i => i.id === itemId ? { ...i, checked: !i.checked, status: !i.checked ? 'done' : 'todo' } : i)
    } : sec));
  }, [updateState]);

  const changeStatus = useCallback((secId, itemId, newStatus) => {
    updateState(prev => prev.map(sec => sec.id === secId ? {
      ...sec, items: sec.items.map(i => i.id === itemId ? { ...i, status: newStatus, checked: newStatus === 'done' } : i)
    } : sec));
  }, [updateState]);

  const deleteItem = useCallback((secId, itemId) => {
    updateState(prev => prev.map(sec => sec.id === secId ? { ...sec, items: sec.items.filter(i => i.id !== itemId) } : sec));
  }, [updateState]);

  const addItem = useCallback((secId, text) => {
    updateState(prev => prev.map(sec => sec.id === secId ? {
      ...sec, items: [...sec.items, { id: Date.now().toString(), text, checked: false, status: 'todo', color: 'default', assignee: null }]
    } : sec));
  }, [updateState]);

  const editItem = useCallback((secId, itemId, newText) => {
    updateState(prev => prev.map(sec => sec.id === secId ? { ...sec, items: sec.items.map(i => i.id === itemId ? {...i, text: newText} : i) } : sec));
  }, [updateState]);

  const cycleItemColor = useCallback((secId, itemId) => {
    updateState(prev => prev.map(sec => sec.id === secId ? {
      ...sec, items: sec.items.map(i => {
        if (i.id !== itemId) return i;
        const cycle = ['default', 'red', 'yellow', 'green'];
        return {...i, color: cycle[(cycle.indexOf(i.color || 'default') + 1) % cycle.length]};
      })
    } : sec));
  }, [updateState]);

  const cycleAssignee = useCallback((secId, itemId) => {
    updateState(prev => prev.map(sec => sec.id === secId ? {
      ...sec, items: sec.items.map(i => {
        if (i.id !== itemId) return i;
        const currentIdx = TEAM.findIndex(t => t.id === i.assignee);
        const nextId = currentIdx === -1 ? TEAM[0].id : (currentIdx + 1 >= TEAM.length ? null : TEAM[currentIdx + 1].id);
        return {...i, assignee: nextId};
      })
    } : sec));
  }, [updateState]);

  const moveItem = useCallback((srcSecId, srcItemId, tgtSecId, tgtItemId) => {
    updateState(prev => {
      const newSecs = JSON.parse(JSON.stringify(prev)); 
      const sSec = newSecs.find(s => s.id === srcSecId);
      const tSec = newSecs.find(s => s.id === tgtSecId);
      const srcIdx = sSec.items.findIndex(i => i.id === srcItemId);
      if (srcIdx === -1) return prev;
      const [item] = sSec.items.splice(srcIdx, 1);
      
      if (tgtItemId) {
        const tgtIdx = tSec.items.findIndex(i => i.id === tgtItemId);
        if (tgtIdx !== -1) tSec.items.splice(tgtIdx, 0, item);
        else tSec.items.push(item);
      } else {
        tSec.items.push(item);
      }
      return newSecs;
    });
  }, [updateState]);

  // Функции экспорта и импорта
  const exportToFile = () => {
    const dataStr = JSON.stringify(sections, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `magdecor_dashboard_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importFromFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          updateState(importedData);
        } else {
          alert("Неверный формат файла бэкапа.");
        }
      } catch (err) {
        alert("Ошибка при чтении файла.");
      }
    };
    reader.readAsText(file);
    event.target.value = null; // Сброс инпута
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      {showConfetti && <Confetti />}
      
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 sm:p-6 md:p-8 font-sans transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col h-full">
          
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 text-white rounded-lg shadow-sm">
                <LayoutDashboard size={28} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                  MAGDECOR & METALLHAUT
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Панель управления задачами</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" placeholder="Поиск..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:text-slate-200"
                />
              </div>

              {/* Кнопки Экспорта и Импорта */}
              <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg border border-slate-300 dark:border-slate-700 shadow-inner mr-1">
                <button onClick={exportToFile} className="px-2 py-1.5 rounded-md flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all" title="Скачать задачи в файл (Бэкап)">
                  <Download size={16} />
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1.5 rounded-md flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all" title="Загрузить задачи из файла">
                  <Upload size={16} />
                </button>
                <input type="file" accept=".json" ref={fileInputRef} onChange={importFromFile} className="hidden" />
              </div>

              <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg border border-slate-300 dark:border-slate-700 shadow-inner mr-2">
                <button 
                  onClick={() => {setViewMode('grid'); localStorage.setItem('dashViewMode', 'grid')}}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <LayoutDashboard size={16} /> <span className="hidden sm:inline">Секции</span>
                </button>
                <button 
                  onClick={() => {setViewMode('kanban'); localStorage.setItem('dashViewMode', 'kanban')}}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <Columns size={16} /> <span className="hidden sm:inline">Канбан</span>
                </button>
              </div>

              <button onClick={() => setHideCompleted(!hideCompleted)} className={`p-2 rounded-lg transition-colors border shadow-sm ${hideCompleted ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`} title="Скрыть готовое">
                {hideCompleted ? <FilterX size={20} /> : <Filter size={20} />}
              </button>
              <button onClick={() => { setIsDark(!isDark); localStorage.setItem('dashThemeDark', (!isDark).toString()); }} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-slate-600 dark:text-slate-300 transition-colors" title="Тема">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </header>

          <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4 flex-shrink-0">
            <div className="flex-1 w-full bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Общий прогресс: <strong className="text-slate-900 dark:text-slate-100">{progressStats.completed} из {progressStats.total} задач</strong>
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{progressStats.percent}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-3 overflow-hidden shadow-inner transition-colors">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-700 ease-out" style={{ width: `${progressStats.percent}%` }}></div>
              </div>
            </div>

            {syncStatus !== 'disabled' && (
              <div className="flex items-center gap-2 px-4 py-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-sm whitespace-nowrap">
                {syncStatus === 'synced' && <><Cloud size={20} className="text-green-500"/><span className="font-medium">В облаке</span></>}
                {syncStatus === 'syncing' && <><Cloud size={20} className="text-blue-500 animate-pulse"/><span className="font-medium">Синхронизация</span></>}
              </div>
            )}
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1 items-start">
              {sections.map(section => (
                <SectionCard 
                  key={section.id} section={section} hideCompleted={hideCompleted} searchQuery={searchQuery}
                  onToggle={toggleItem} onDelete={deleteItem} onAdd={addItem} onEdit={editItem} onColorCycle={cycleItemColor} onAssignCycle={cycleAssignee} onMove={moveItem}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <KanbanColumn title="🎯 Нужно сделать" status="todo" items={kanbanData.todo} onStatusChange={changeStatus} onToggle={toggleItem} onAssignCycle={cycleAssignee} onColorCycle={cycleItemColor} />
              <KanbanColumn title="⏳ В процессе" status="in-progress" items={kanbanData.inProgress} onStatusChange={changeStatus} onToggle={toggleItem} onAssignCycle={cycleAssignee} onColorCycle={cycleItemColor} />
              <KanbanColumn title="✅ Готово" status="done" items={kanbanData.done} onStatusChange={changeStatus} onToggle={toggleItem} onAssignCycle={cycleAssignee} onColorCycle={cycleItemColor} />
            </div>
          )}

        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          .custom-scrollbar::-webkit-scrollbar { width: 5px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
          .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
          
          @keyframes confetti-fall {
            0% { transform: translateY(-10vh) rotate(0deg) translateX(0); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg) translateX(50px); opacity: 0; }
          }
          .confetti-piece { position: absolute; top: -20px; z-index: 100; border-radius: 2px; animation: confetti-fall linear forwards; }
        `}} />
      </div>
    </div>
  );
}
