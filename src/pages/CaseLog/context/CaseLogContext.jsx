import React, { useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCaseLogStore } from '../../../store/useCaseLogStore';

// === Hook Facade: 負責綁定 AuthContext 與 ModalContext ===
export const useCaseLog = (setAlertDialog) => {
  const { user, login } = useAuth();

  // 取得 State (使用個別 selector 避免不必要的全域重新渲染)
  const students = useCaseLogStore(state => state.students);
  const activeStudentId = useCaseLogStore(state => state.activeStudentId);
  const activeTemplate = useCaseLogStore(state => state.activeTemplate);
  const globalTemplates = useCaseLogStore(state => state.globalTemplates); // 🌟 新增：取得公版清單
  const logs = useCaseLogStore(state => state.logs);
  const isLoading = useCaseLogStore(state => state.isLoading);
  const isSyncing = useCaseLogStore(state => state.isSyncing);
  const error = useCaseLogStore(state => state.error);

  const handleError = useCallback((err, defaultMessage) => {
    console.error('[CaseLog]', err);
    if (err.message === 'TokenExpired' || err.message === '未登入') {
      if (setAlertDialog) {
        setAlertDialog({
          isOpen: true,
          title: '登入安全時效已過',
          message: '為保護您的雲端資料安全，Google 登入憑證已過期或尚未登入。請點擊下方按鈕重新登入。',
          type: 'confirm',
          variant: 'warning',
          confirmText: '重新登入',
          onConfirm: () => {
            setAlertDialog(prev => ({ ...prev, isOpen: false }));
            setTimeout(() => {
              if (login) login();
            }, 100);
          }
        });
      }
      useCaseLogStore.getState().setError('請重新登入 Google 帳號。');
    } else {
      useCaseLogStore.getState().setError(defaultMessage);
    }
  }, [login, setAlertDialog]);

  // --- 綁定 Context 到 Store Actions (使用 getState() 取得穩定的函式參照) ---

  const loadStudentDataBound = useCallback((studentId) => {
    return useCaseLogStore.getState().loadStudentData(studentId, user, handleError, setAlertDialog);
  }, [user, handleError, setAlertDialog]);

  const createStudentProfileBound = useCallback((studentName) => {
    return useCaseLogStore.getState().createStudentProfile(studentName, user, handleError);
  }, [user, handleError]);

  const deleteStudentProfileBound = useCallback((studentId, deleteFromCloud = false) => {
    return useCaseLogStore.getState().deleteStudentProfile(studentId, deleteFromCloud, user, handleError);
  }, [user, handleError]);

  // 🌟 升級：綁定匯入共編學生 (接收 Picker 回傳的 sheetId + fileName)
  const importSharedStudentBound = useCallback((sheetId, fileName) => {
    return useCaseLogStore.getState().importSharedStudent(sheetId, fileName, user, handleError);
  }, [user, handleError]);

  const saveDraftBound = useCallback((logData, existingDraftId = null) => {
    return useCaseLogStore.getState().saveDraft(logData, existingDraftId, user);
  }, [user]);

  const addLogEntryBound = useCallback((logData, draftIdToRemove = null) => {
    return useCaseLogStore.getState().addLogEntry(logData, draftIdToRemove, user, handleError);
  }, [user, handleError]);

  const updateLogEntryBound = useCallback((logId, updatedData) => {
    return useCaseLogStore.getState().updateLogEntry(logId, updatedData, user, handleError);
  }, [user, handleError]);

  const deleteSingleLogBound = useCallback((logId) => {
    return useCaseLogStore.getState().deleteSingleLog(logId, user, handleError);
  }, [user, handleError]);

  const generateParentLinkBound = useCallback(() => {
    return useCaseLogStore.getState().generateParentLink(user, handleError);
  }, [user, handleError]);

  // 🌟 核心修正 3：綁定手動重新整理
  const refreshStudentLogsBound = useCallback((studentId) => {
    return useCaseLogStore.getState().refreshStudentLogs(studentId, user, handleError);
  }, [user, handleError]);

  return {
    // State
    students,
    activeStudent: students.find(s => s.id === activeStudentId) || null,
    activeStudentId,
    activeTemplate,
    globalTemplates, // 🌟 新增
    logs,
    isLoading,
    isSyncing,
    error,

    // Actions (No auth needed)
    setActiveStudentId: useCaseLogStore.getState().setActiveStudentId,
    saveTemplate: useCaseLogStore.getState().saveTemplate,
    clearError: useCaseLogStore.getState().clearError,

    // 🌟 新增：公版操作函數 (No auth needed, relies on indexedDB)
    saveGlobalTemplate: useCaseLogStore.getState().saveGlobalTemplate,
    deleteGlobalTemplate: useCaseLogStore.getState().deleteGlobalTemplate,
    applyGlobalTemplate: useCaseLogStore.getState().applyGlobalTemplate,

    // Actions (Auth needed, bound to Context)
    loadStudentData: loadStudentDataBound,
    createStudentProfile: createStudentProfileBound,
    importSharedStudent: importSharedStudentBound, // 🌟 新增
    addLogEntry: addLogEntryBound,
    generateParentLink: generateParentLinkBound,
    deleteStudentProfile: deleteStudentProfileBound,
    updateLogEntry: updateLogEntryBound,
    saveDraft: saveDraftBound,
    deleteSingleLog: deleteSingleLogBound,
    refreshStudentLogs: refreshStudentLogsBound // 🌟 匯出重新整理功能
  };
};

export const CaseLogDataLoader = ({ children, setAlertDialog }) => {
  const loadInitialStudents = useCaseLogStore(state => state.loadInitialStudents);
  const activeStudentId = useCaseLogStore(state => state.activeStudentId);
  const { loadStudentData } = useCaseLog(setAlertDialog);

  useEffect(() => {
    loadInitialStudents();
  }, [loadInitialStudents]);

  useEffect(() => {
    loadStudentData(activeStudentId);
  }, [activeStudentId, loadStudentData]);

  return <>{children}</>;
};