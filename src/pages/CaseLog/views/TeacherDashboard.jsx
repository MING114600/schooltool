import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Users, Settings, FileText, Link as LinkIcon,
  Copy, CheckCircle2, AlertCircle, Loader2, Calendar, Lock, Trash2, Edit3,
  ChevronDown, ChevronRight, CheckSquare, Square, Printer, Search, X, ChevronLeft
} from 'lucide-react';
import { UI_THEME } from '../../../constants';
import { useCaseLog } from '../context/CaseLogContext';
import { useModalContext } from '../../../context/ModalContext';
import DialogModal from '../../../components/common/DialogModal';
import TemplateEditor from '../components/TemplateEditor';
import TemplateManager from '../components/TemplateManager'; // 🌟 新增：公版管理組件
import LogForm from '../components/LogForm';
import { useAuth } from '../../../context/AuthContext';
import ShareManagerModal from './components/ShareManagerModal'; // 🌟 新增：共編管理 Dialog
import { openSpreadsheetPicker } from '../../../services/googlePickerService'; // 🌟 新增：Picker API
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import StandardAppLayout from '../../../components/common/layout/StandardAppLayout';

export default function TeacherDashboard() {
  const { setAlertDialog } = useModalContext();
  const { user } = useAuth();
  const {
    students,
    activeStudent,
    activeStudentId,
    activeTemplate,
    logs,
    isLoading,
    isSyncing,
    error,
    setActiveStudentId,
    createStudentProfile,
    addLogEntry,
    saveTemplate,
    generateParentLink,
    clearError,
    deleteStudentProfile,
    updateLogEntry,
    saveDraft,
    deleteSingleLog,
    importSharedStudent, // 🌟 新增
    refreshStudentLogs   // 🌟 核心修正 3：加入手動重新整理
  } = useCaseLog(setAlertDialog);

  // 視圖切換 ('logs' | 'template')
  const [activeTab, setActiveTab] = useState('logs');

  // 🌟 目前選取的日誌 ID ('new' 代表正在新增，其他字串代表檢視舊紀錄)
  const [selectedLogId, setSelectedLogId] = useState('new');
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileActivePane, setMobileActivePane] = useState('list');
  const [pendingAuthRetry, setPendingAuthRetry] = useState(null);

  // 🌟 新增：用於追蹤編輯器中最新的積木狀態，供存為公版時使用
  const currentBlocksRef = React.useRef([]);
  const {
    globalTemplates,
    saveGlobalTemplate,
    applyGlobalTemplate,
    deleteGlobalTemplate
  } = useCaseLog(setAlertDialog);

  // 🌟 3. 新增自動重試 Effect：偵測到新 Token 時自動執行
  useEffect(() => {
    // 條件：有待辦任務 + 擁有有效的 Token + 該 Token 不等於當初失敗的舊 Token
    if (pendingAuthRetry && user?.accessToken && user.accessToken !== pendingAuthRetry.failedToken) {
      const retryPublish = async () => {
        const { data, targetDraftId, isNewOrDraft, originalLogId } = pendingAuthRetry;

        try {
          console.log('正在自動重試發布...');
          if (isNewOrDraft) {
            await addLogEntry(data, targetDraftId, true);
          } else {
            await updateLogEntry(originalLogId, data, true);
          }
          setPendingAuthRetry(null);
          console.log('重試成功，已發布');
        } catch (err) {
          console.error('重試失敗', err);
        }
      };

      retryPublish();
    }
  }, [user?.accessToken, pendingAuthRetry, updateLogEntry, addLogEntry]);


  // 🌟 新增：文字放大縮小狀態 (加上 localStorage 記憶功能)
  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem('caseLog_zoomLevel');
    return saved ? parseInt(saved, 10) : 0;
  });

  // 每次 zoomLevel 變更時，儲存到 localStorage
  useEffect(() => {
    localStorage.setItem('caseLog_zoomLevel', zoomLevel.toString());
  }, [zoomLevel]);

  const getZoomClasses = () => {
    switch (zoomLevel) {
      case 1: return { title: 'text-3xl', date: 'text-3xl', info: 'text-base', label: 'text-base', content: 'text-lg' };
      case 2: return { title: 'text-4xl', date: 'text-4xl', info: 'text-lg', label: 'text-lg', content: 'text-xl' };
      case 3: return { title: 'text-5xl', date: 'text-5xl', info: 'text-xl', label: 'text-xl', content: 'text-2xl' };
      case 4: return { title: 'text-6xl', date: 'text-6xl', info: 'text-2xl', label: 'text-2xl', content: 'text-3xl' };
      default: return { title: 'text-2xl', date: 'text-2xl', info: 'text-sm', label: 'text-sm', content: 'text-base' };
    }
  };
  const uiZoom = getZoomClasses();

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    if (!searchQuery.trim()) return logs;

    const lowerQuery = searchQuery.toLowerCase();
    return logs.filter(log => {
      // 搜尋日期
      if (log.date.includes(lowerQuery)) return true;
      // 搜尋內部備註
      if (log.privateNote && log.privateNote.toLowerCase().includes(lowerQuery)) return true;
      // 搜尋日誌動態內容 (比對字串或陣列)
      if (log.content) {
        return Object.values(log.content).some(val => {
          if (typeof val === 'string') return val.toLowerCase().includes(lowerQuery);
          if (Array.isArray(val)) return val.join(' ').toLowerCase().includes(lowerQuery);
          return false;
        });
      }
      return false;
    });
  }, [logs, searchQuery]);

  // ==========================================
  // 🌟 階段一：月份摺疊清單邏輯
  // ==========================================
  const [expandedMonths, setExpandedMonths] = useState({});

  // 透過 useMemo 自動將 logs 轉換為以「YYYY年MM月」為單位的群組
  const groupedLogs = useMemo(() => {
    // 將原本的 logs 改為 filteredLogs
    if (!filteredLogs || filteredLogs.length === 0) return [];

    const groups = {};
    filteredLogs.forEach(log => {
      const [year, month] = log.date.split('-');
      const monthKey = `${year}年${month}月`;

      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(log);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(key => ({
        month: key,
        logs: groups[key]
      }));
  }, [filteredLogs]);

  // 當切換學生時，自動展開「最新的一個月」，其餘摺疊
  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedLogIds([]);
    setSearchQuery(''); // 🌟 新增：切換學生時自動清空搜尋條件
    setMobileActivePane('list');
  }, [activeStudentId]);

  // 切換特定月份的展開/摺疊狀態
  const toggleMonth = (monthKey) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  // 對話框狀態
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [shareLinkData, setShareLinkData] = useState({ isOpen: false, link: '', copied: false });

  // 當切換學生或選取不同日誌時，重置編輯狀態
  useEffect(() => {
    setIsEditingMode(false);
  }, [selectedLogId, activeStudentId]);

  // 處理新增學生
  const handleCreateStudent = async (studentName) => {
    if (!studentName.trim()) return false;
    try {
      await createStudentProfile(studentName.trim());
      setIsAddStudentOpen(false);
      setActiveTab('template');
      return true;
    } catch (err) {
      if (err.message === 'TokenExpired' || err.message === '未登入') {
        setIsAddStudentOpen(false);
      }
      return false;
    }
  };

  // 🌟 共編管理：直接開啟 ShareManagerModal
  const [isShareManagerOpen, setIsShareManagerOpen] = useState(false);
  const handleOpenShareManager = () => {
    setIsShareManagerOpen(true);
  };

  // 🌟 透過 Picker 匯入學生檔案
  const handleImportStudent = async () => {
    try {
      const result = await openSpreadsheetPicker(user.accessToken);
      if (!result) return;
      await importSharedStudent(result.id, result.name);
      setActiveTab('logs');
    } catch (err) {
      if (err.message !== '用戶取消選擇') {
        console.error('Picker import error:', err);
        setAlertDialog({
          isOpen: true,
          title: '匯入失敗',
          message: err.message,
          type: 'alert',
          variant: 'danger',
          onConfirm: () => setAlertDialog(prev => ({ ...prev, isOpen: false }))
        });
      }
    }
  };

  // ==========================================
  // 🌟 階段二：批次選取模式邏輯
  // ==========================================
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedLogIds, setSelectedLogIds] = useState([]);

  // 當切換學生時，自動關閉選取模式並清空選取清單
  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedLogIds([]);
  }, [activeStudentId]);

  // 切換單一日誌的選取狀態
  const toggleSelectLog = (logId, e) => {
    e.stopPropagation();
    setSelectedLogIds(prev =>
      prev.includes(logId) ? prev.filter(id => id !== logId) : [...prev, logId]
    );
  };

  // 全選 / 取消全選該學生的所有日誌
  const handleSelectAll = () => {
    if (selectedLogIds.length === logs.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(logs.map(log => log.id));
    }
  };

  // 處理產生家長連結與複製
  const handleGenerateLink = async () => {
    try {
      const baseLink = await generateParentLink();

      // 🌟 修正：抓取已勾選日誌的「時間戳記 (timestamp)」，並做 URL 編碼確保安全
      const selectedTimestamps = logs
        .filter(log => selectedLogIds.includes(log.id))
        .map(log => encodeURIComponent(log.timestamp));

      // 🌟 改用 tms (timestamps的縮寫) 當作參數名稱
      const finalLink = (isSelectionMode && selectedLogIds.length > 0)
        ? `${baseLink}&tms=${selectedTimestamps.join(',')}`
        : baseLink;

      setShareLinkData({ isOpen: true, link: finalLink, copied: false });
    } catch (err) { }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLinkData.link);
      setShareLinkData(prev => ({ ...prev, copied: true }));
      setTimeout(() => setShareLinkData(prev => ({ ...prev, copied: false })), 2000);
    } catch (err) {
      console.error('複製失敗', err);
    }
  };

  // ==========================================
  // 🌟 渲染區塊：右側的舊日誌詳細內容
  // ==========================================
  const renderLogDetail = () => {
    const log = logs.find(l => l.id === selectedLogId);
    if (!log) return null;

    const cleanAuthor = log.author.replace(' (已編輯)', '');

    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">

        <div className={`p-6 rounded-2xl border ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_MAIN} shadow-sm`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className={`${uiZoom.title} font-bold ${UI_THEME.TEXT_PRIMARY} mb-2 flex items-center gap-2 transition-all`}>
                  <Calendar className={UI_THEME.TEXT_SECONDARY} />
                  {log.date}
                </h2>
              </div>

              <div className={`flex items-center gap-3 ${uiZoom.info} ${UI_THEME.TEXT_MUTED} transition-all`}>
                <span className="flex items-center gap-1">
                  <Users size={14} /> {cleanAuthor}
                </span>
                {log.isEdited && (
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                    已編輯
                  </span>
                )}
                <span>•</span>
                <span>
                  建立於 {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              {/* 🌟 文字放大縮小控制項 (移到此處以防位置跑掉) */}
              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 shadow-inner">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0, prev - 1))}
                  disabled={zoomLevel === 0}
                  className={`px-2 py-0.5 text-xs font-bold rounded-md transition-colors ${zoomLevel === 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm hover:text-indigo-600'}`}
                  title="縮小文字"
                >
                  Aa-
                </button>
                <div className="w-px h-3 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(4, prev + 1))}
                  disabled={zoomLevel === 4}
                  className={`px-2 py-0.5 text-xs font-bold rounded-md transition-colors ${zoomLevel === 4 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm hover:text-indigo-600'}`}
                  title="放大文字"
                >
                  Aa+
                </button>
              </div>

              <button
                onClick={() => setIsEditingMode(true)}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
              >
                <Edit3 size={16} /> 編輯
              </button>

              <button
                onClick={() => {
                  setAlertDialog({
                    isOpen: true,
                    title: '刪除單篇日誌',
                    message: `確定要刪除這篇 ${log.date} 的紀錄嗎？\n此動作將無法復原。`,
                    type: 'confirm',
                    variant: 'danger',
                    confirmText: '刪除中...',
                    isBusy: isSyncing,
                    onConfirm: async () => {
                      setAlertDialog(prev => ({ ...prev, isBusy: true }));
                      await deleteSingleLog(log.id);
                      setSelectedLogId('new');
                      setAlertDialog(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                }}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400"
              >
                <Trash2 size={16} /> 刪除
              </button>
            </div>
          </div>

          <hr className={`border-t ${UI_THEME.BORDER_DEFAULT} my-4`} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            {log.template?.map(block => {
              const val = log.content[block.id];
              if (val === undefined || val === '') return null;
              const isFullWidth = block.type === 'text' || block.type === 'image';

              return (
                <div key={block.id} className={`flex flex-col gap-1.5 ${isFullWidth ? 'md:col-span-2' : ''}`}>
                  <span className={`${uiZoom.label} font-bold ${UI_THEME.TEXT_MUTED} transition-all`}>{block.label}</span>
                  <div className={`${uiZoom.content} font-medium ${UI_THEME.TEXT_PRIMARY} whitespace-pre-wrap transition-all`}>
                    {Array.isArray(val) ? val.join(', ') : (block.type === 'rating' ? `${val} 星` : val)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ✅ 放在同一張卡片內：渲染圖片附件 */}
          {log.attachments && log.attachments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className={`text-sm font-bold ${UI_THEME.TEXT_MUTED} mb-3 block`}>照片紀錄</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {log.attachments.map((file, idx) => {

                  // 判斷是否已經有 driveId (已上傳雲端)
                  const hasDriveId = Boolean(file.driveId);

                  // 如果有 driveId 用縮圖 API，否則 (草稿) 用 createObjectURL 產生本地暫時預覽
                  const imgSrc = hasDriveId
                    ? `https://drive.google.com/thumbnail?id=${file.driveId}&sz=w1000`
                    : (file instanceof File || file instanceof Blob) ? URL.createObjectURL(file) : '';

                  // 點擊放大的連結 (雲端給外部連結，本地給 blob 連結)
                  const linkHref = hasDriveId ? file.url : imgSrc;

                  return (
                    <div key={idx} className="relative aspect-square rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <a href={linkHref} target="_blank" rel="noreferrer" title="點擊開啟原圖">
                        <img
                          src={imgSrc}
                          alt={file.name || '照片紀錄'}
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                        />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {log.privateNote && (
          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-500">
              <Lock size={18} />
              <span className="font-bold">內部備註 (家長不可見)</span>
            </div>
            <p className="text-amber-900 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
              {log.privateNote}
            </p>
          </div>
        )}

      </div>
    );
  };

  const [isAppSidebarOpen, setIsAppSidebarOpen] = useState(true);

  const renderSidebar = () => (
    <Sidebar
      students={students}
      activeStudent={activeStudent}
      activeStudentId={activeStudentId}
      isLoading={isLoading}
      isSyncing={isSyncing}
      setActiveStudentId={setActiveStudentId}
      setIsAddStudentOpen={setIsAddStudentOpen}
      handleImportStudent={handleImportStudent}
    />
  );

  const renderHeader = () => {
    if (!activeStudent) return null;
    return (
      <Toolbar
        activeStudent={activeStudent}
        setActiveStudentId={setActiveStudentId}
        isSyncing={isSyncing}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleGenerateLink={handleGenerateLink}
        handleShareCoedit={() => setIsShareManagerOpen(true)}
        handleRefresh={() => refreshStudentLogs(activeStudentId)}
        setAlertDialog={setAlertDialog}
        deleteStudentProfile={deleteStudentProfile}
      />
    );
  };

  return (
    <>
      <StandardAppLayout
        isSidebarOpen={isAppSidebarOpen}
        onToggleSidebar={() => setIsAppSidebarOpen(!isAppSidebarOpen)}
        sidebar={renderSidebar()}
        header={renderHeader()}
        sidebarWidth="w-64" // CaseLog 側欄通常比較標準寬度
        sidebarOpenWidth="16rem"
      >
        <div className={`flex w-full h-full relative min-w-0 ${UI_THEME.CONTENT_AREA}`}>

          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white shadow-lg font-bold text-sm animate-in slide-in-from-top-4">
              <AlertCircle size={16} />
              {error}
              <button onClick={clearError} className="ml-2 hover:text-rose-200">✕</button>
            </div>
          )}

          {!activeStudent && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50">
              <Users size={64} className="mb-4 text-slate-400" />
              <h2 className={`text-xl font-bold ${UI_THEME.TEXT_PRIMARY}`}>請從左側選擇或新增學生</h2>
            </div>
          )}

          {/* ================= 內容渲染區塊 ================= */}
          {activeStudent && (
            <div className="flex-1 flex overflow-hidden">
              {activeTab === 'template' ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* 🌟 新增：公版管理器 */}
                  <TemplateManager
                    globalTemplates={globalTemplates}
                    getCurrentTemplate={() => currentBlocksRef.current}
                    onSaveAsGlobal={saveGlobalTemplate}
                    onApplyGlobal={async (tplId) => {
                      await applyGlobalTemplate(activeStudentId, tplId);
                    }}
                    onDeleteGlobal={deleteGlobalTemplate}
                    isSyncing={isSyncing}
                  />

                  <div className="flex-1 overflow-y-auto p-6">
                    <TemplateEditor
                      template={activeTemplate} // 🌟 修正：從 initialTemplate 改為 template
                      onChange={(blocks) => {
                        currentBlocksRef.current = blocks;
                      }}
                      onSave={async (newTemplate) => {
                        await saveTemplate(newTemplate);
                        setAlertDialog({
                          isOpen: true,
                          title: '儲存成功',
                          message: '已儲存此學生的客製化版面配置。',
                          type: 'alert',
                          variant: 'success',
                          onConfirm: () => {
                            setAlertDialog(prev => ({ ...prev, isOpen: false }));
                            setActiveTab('logs');
                          }
                        });
                      }}
                      isSaving={isSyncing}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* 🌟 中欄：日誌選單 (包含正確的範圍與相對定位) */}
                  <div className={`${mobileActivePane === 'detail' ? 'hidden md:flex' : 'flex w-full'} md:w-80 shrink-0 flex-col border-r ${UI_THEME.BORDER_DEFAULT} bg-slate-50/30 dark:bg-slate-900/30 relative`}>

                    {/* 中欄頂部：控制列 */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                      <div className="relative">
                        <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${UI_THEME.TEXT_MUTED}`} />
                        <input
                          type="text"
                          placeholder="搜尋內容、備註或日期..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`w-full pl-9 pr-8 py-2 text-sm transition-all ${UI_THEME.INPUT_BASE}`}
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className={`absolute right-2.5 top-1/2 -translate-y-1/2 hover:text-rose-500 transition-colors ${UI_THEME.TEXT_MUTED}`}
                            title="清除搜尋"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLogId('new');
                          setMobileActivePane('detail'); // 🌟 新增：切換到詳細畫面
                        }}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm ${selectedLogId === 'new' && !isSelectionMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 dark:bg-slate-800 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                      >
                        <Plus size={18} /> 撰寫新日誌
                      </button>

                      {logs.length > 0 && (
                        <div className="flex items-center justify-between px-1">
                          <button
                            onClick={() => {
                              setIsSelectionMode(!isSelectionMode);
                              if (isSelectionMode) setSelectedLogIds([]);
                            }}
                            className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${isSelectionMode ? 'text-blue-600 dark:text-blue-400' : UI_THEME.TEXT_SECONDARY + ' hover:text-blue-500'
                              }`}
                          >
                            {isSelectionMode ? <CheckSquare size={16} /> : <Square size={16} />}
                            {isSelectionMode ? '取消選取模式' : '批次選取'}
                          </button>

                          {isSelectionMode && (
                            <button
                              onClick={handleSelectAll}
                              className={`text-xs font-bold ${UI_THEME.TEXT_MUTED} hover:text-blue-500 underline`}
                            >
                              {selectedLogIds.length === logs.length ? '取消全選' : '全選'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 中欄內容：摺疊清單 */}
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                      {groupedLogs.length === 0 ? (
                        <div className={`text-sm text-center p-8 ${UI_THEME.TEXT_MUTED} font-bold`}>尚無歷史紀錄</div>
                      ) : (
                        groupedLogs.map(group => (
                          <div key={group.month} className="flex flex-col gap-1.5">
                            <button
                              onClick={() => toggleMonth(group.month)}
                              className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-sm font-bold transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/50 ${UI_THEME.TEXT_SECONDARY}`}
                            >
                              <div className="flex items-center gap-1.5">
                                {expandedMonths[group.month] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <span>{group.month}</span>
                              </div>
                              <span className="text-xs opacity-60 font-medium bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                {group.logs.length} 篇
                              </span>
                            </button>

                            {expandedMonths[group.month] && (
                              <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200 pl-1 border-l-2 border-slate-200/50 dark:border-slate-800/50 ml-2.5">
                                {group.logs.map(log => {
                                  const isSelected = selectedLogIds.includes(log.id);
                                  return (
                                    <button
                                      key={log.id}
                                      onClick={(e) => {
                                        if (isSelectionMode) {
                                          toggleSelectLog(log.id, e);
                                        } else {
                                          setSelectedLogId(log.id);
                                          setMobileActivePane('detail'); // 🌟 新增：切換到詳細畫面
                                          if (log.isDraft) setIsEditingMode(true);
                                          else setIsEditingMode(false);
                                        }
                                      }}
                                      className={`relative p-3 rounded-xl text-left border transition-all ml-1.5 ${isSelectionMode && isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 shadow-sm'
                                        : selectedLogId === log.id && !isSelectionMode
                                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                                          : `border-transparent hover:bg-white dark:hover:bg-slate-800 ${UI_THEME.TEXT_PRIMARY}`
                                        }`}
                                    >
                                      <div className="flex justify-between items-start mb-1 gap-2">
                                        <div className="flex items-center gap-2">
                                          {isSelectionMode && (
                                            <div className={`shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                              {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                            </div>
                                          )}
                                          <span className="font-bold text-sm">{log.date}</span>
                                          {/* 🌟 顯示草稿標籤 */}
                                          {log.isDraft && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 font-bold shrink-0">
                                              草稿
                                            </span>
                                          )}
                                        </div>
                                        <span className={`text-xs shrink-0 mt-0.5 ${UI_THEME.TEXT_MUTED}`}>
                                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <div className={`text-xs ${UI_THEME.TEXT_SECONDARY} truncate flex items-center gap-1.5 ${isSelectionMode ? 'pl-6' : ''}`}>
                                        <Users size={12} /> {log.author}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* 🌟 底部浮動操作列 (已補回) */}
                    {isSelectionMode && selectedLogIds.length > 0 && (
                      <div className="absolute bottom-4 left-4 right-4 animate-in slide-in-from-bottom-4">
                        <div className="bg-slate-800 dark:bg-slate-100 rounded-2xl p-3 shadow-xl flex items-center justify-between">
                          <span className="text-white dark:text-slate-900 text-sm font-bold pl-2">
                            已選 {selectedLogIds.length} 篇
                          </span>
                          <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                          >
                            <Printer size={16} /> 列印/匯出
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 右欄：主畫面 */}
                  <div className={`${mobileActivePane === 'list' ? 'hidden md:flex' : 'flex w-full'} flex-1 flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-900/50`}>
                    {/* 🌟 新增：手機版「返回日誌清單」按鈕 */}
                    <div className="md:hidden flex items-center p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <button
                        onClick={() => setMobileActivePane('list')}
                        className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <ChevronLeft size={20} /> 返回日誌清單
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                      {(selectedLogId === 'new' || isEditingMode) ? (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                          {activeTemplate && activeTemplate.length > 0 ? (
                            <LogForm
                              // 🌟 核心修正 2：編輯模式下，優先使用該篇日誌儲存的專屬 template，不再強制套用 activeTemplate
                              template={selectedLogId !== 'new' && logs.find(l => l.id === selectedLogId)?.template && logs.find(l => l.id === selectedLogId).template.length > 0 ? logs.find(l => l.id === selectedLogId).template : activeTemplate}
                              logId={selectedLogId}
                              activeStudentId={activeStudent.id}
                              initialData={selectedLogId === 'new' ? null : logs.find(l => l.id === selectedLogId)}
                              onCancel={selectedLogId === 'new' ? null : () => setIsEditingMode(false)}
                              // 點擊「儲存草稿」
                              onSaveDraft={async (data) => {
                                const draftId = selectedLogId === 'new' ? null : selectedLogId;
                                await saveDraft(data, draftId);
                                setSelectedLogId('new'); // 將畫面鎖定在剛存好的草稿上
                              }}

                              // 點擊「發布/儲存修改」
                              onSubmit={async (data) => {
                                let targetDraftId = null;
                                const originalLogId = selectedLogId;
                                const isNewOrDraft = originalLogId === 'new' || logs.find(l => l.id === originalLogId)?.isDraft;

                                try {
                                  // 第一道防線：發布前先強制將最新修改存入本地草稿
                                  if (isNewOrDraft) {
                                    targetDraftId = await saveDraft(data, originalLogId === 'new' ? null : originalLogId);
                                    setSelectedLogId(targetDraftId);
                                  }

                                  // 第二步：嘗試向雲端發布
                                  if (isNewOrDraft) {
                                    await addLogEntry(data, targetDraftId);
                                  } else {
                                    await updateLogEntry(originalLogId, data);
                                  }

                                  // 成功後關閉畫面
                                  setIsEditingMode(false);
                                  setSelectedLogId('new');

                                } catch (err) {
                                  // 🌟 發生斷線或 Token 過期時，登記重試任務
                                  setPendingAuthRetry({
                                    data,
                                    targetDraftId,
                                    isNewOrDraft,
                                    originalLogId,
                                    failedToken: user?.accessToken // 記錄當下失效的 Token
                                  });
                                  console.log('雲端發布中斷，已登記自動重試任務並保留本地草稿');
                                }
                              }}
                              isSubmitting={isSyncing}
                            />
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-50">
                              <FileText size={48} className="mb-4 text-slate-400" />
                              <h2 className="text-lg font-bold">請先建立或選擇模板</h2>
                            </div>
                          )}
                        </div>
                      ) : (
                        renderLogDetail()
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </StandardAppLayout>

      {/* 🌟 新增：共編管理整合對話框 */}
      <ShareManagerModal
        isOpen={isShareManagerOpen}
        onClose={() => setIsShareManagerOpen(false)}
        sheetId={activeStudent?.sheetId}
        token={user?.accessToken}
        ownerEmail={user?.email}
      />

      {/* 對話框 (新增學生 & 產生連結) */}
      <DialogModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title="新增學生"
        message="請輸入學生姓名。系統將自動在您的 Google Drive 建立一份專屬的紀錄試算表 (Sheet)。"
        type="prompt"
        placeholder="例如: 王小明"
        confirmText={isSyncing ? "建立檔案中..." : "建立檔案"}
        onConfirm={handleCreateStudent}
        isBusy={isSyncing}
      />

      {shareLinkData.isOpen && (
        <div className="fixed inset-0 z-[20001] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="text-blue-500" size={24} />
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">家長唯讀連結</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              請複製以下專屬連結並傳送給家長。該連結具備唯讀權限，且家長無法看見「內部備註」。
            </p>
            <div className="flex items-center gap-2 mb-6">
              <input
                type="text"
                readOnly
                value={shareLinkData.link}
                className={`flex-1 p-3 text-sm rounded-lg border ${UI_THEME.BORDER_DEFAULT} bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 outline-none`}
              />
              <button
                onClick={copyToClipboard}
                className={`p-3 rounded-lg flex items-center justify-center transition-colors ${shareLinkData.copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-800/50'
                  }`}
              >
                {shareLinkData.copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
              </button>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShareLinkData({ isOpen: false, link: '', copied: false })} className={UI_THEME.BTN_PRIMARY}>
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 🌟 4. 階段三新增：隱藏的列印專屬版面 (A4 格式) */}
      {/* ========================================== */}
      <style type="text/css">
        {`
          @media print {
            /* 🌟 1. 強制設定為 A4 直式 (Portrait)，並縮小邊距以增加可用空間 */
            @page { 
              size: A4 portrait; 
              margin: 12mm; 
            }
            /* 解除 SPA 高度限制，確保能印出所有頁面 */
            html, body, #root {
              height: auto !important;
              overflow: visible !important;
              background-color: white !important;
            }
          }
        `}
      </style>

      <div className="hidden print:block w-full bg-white text-black font-sans">
        <h1 className="text-2xl font-bold text-center mb-6 pb-3 border-b-2 border-black">
          {activeStudent?.name} - 學生紀錄日誌
        </h1>

        {/* 🌟 2. 將外層容器改為 2 欄網格 (grid-cols-2)，讓兩篇日誌左右並排 */}
        <div className="grid grid-cols-2 gap-4 items-start">
          {logs
            .filter(log => selectedLogIds.includes(log.id))
            .map(log => (
              <div key={log.id} className="break-inside-avoid border border-gray-400 p-4 rounded-lg">

                {/* 標頭區縮小字體並減少間距 */}
                <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                  <h2 className="text-base font-bold flex items-center gap-1.5">
                    <Calendar size={16} />
                    {log.date}
                  </h2>
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <Users size={12} /> {log.author.replace(' (已編輯)', '')}
                  </span>
                </div>

                {/* 🌟 3. 內層改用 flex-wrap：短資訊會自動擠在同一行，長文字自動折行滿版 */}
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {log.template?.map(block => {
                    const val = log.content[block.id];
                    if (val === undefined || val === '') return null;

                    // 只有文字欄位需要佔滿整行 (w-full)，其他評分/標籤都會自動併排
                    const isFullWidth = block.type === 'text';

                    return (
                      <div key={block.id} className={`flex flex-col gap-1 ${isFullWidth ? 'w-full' : ''}`}>
                        <span className="text-xs font-bold text-gray-500">{block.label}</span>
                        <div className="text-sm font-medium whitespace-pre-wrap">
                          {Array.isArray(val) ? val.join(', ') : (block.type === 'rating' ? `${val} 星` : val)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 🌟 4. 圖片預覽區也跟著縮小，適應單欄的寬度 */}
                {log.attachments && log.attachments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 break-inside-avoid">
                    <span className="text-xs font-bold text-gray-500 mb-2 block">照片紀錄</span>
                    <div className="grid grid-cols-3 gap-2">
                      {log.attachments.map((file, idx) => {
                        const hasDriveId = Boolean(file.driveId);
                        if (!hasDriveId) return null;

                        return (
                          <div key={idx} className="aspect-square rounded border border-gray-300 overflow-hidden">
                            <img
                              // 列印時不需要載入太大的圖片，sz=w400 可以節省記憶體與傳輸時間
                              src={`https://drive.google.com/thumbnail?id=${file.driveId}&sz=w400`}
                              alt={file.name || '照片紀錄'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            ))}
        </div>
      </div>
    </>
  );
}