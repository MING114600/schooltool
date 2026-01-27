import { useState, useCallback } from 'react';

/**
 * 整合所有彈窗狀態的管理 Hook
 */
export const useModalManager = () => {
  // 1. 原有的邏輯 (保持不變，管理主要功能視窗)
    const [activeModal, setActiveModal] = useState(null); 
  const [modalData, setModalData] = useState(null);     

  const openModal = useCallback((modalId, data = null) => {
    setActiveModal(modalId);
    setModalData(data);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  // ============================================================
  // ★ 2. 新增：獨立的 Dialog 管理邏輯 (這是您漏掉的部分)
  // ============================================================
  const [dialogConfig, setDialogConfig] = useState(null); // 存 Dialog 的 props

  const openDialog = useCallback((config) => {
    setDialogConfig(config);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogConfig(null);
  }, []);

  return {
    // 原本的介面
    activeModal,
    modalData,
    openModal,
    closeModal,
    isModalOpen: (modalId) => activeModal === modalId,

    // ★ 必須回傳這些新函式，ClassroomManager 才抓得到！
    dialogConfig,
    openDialog,
    closeDialog
  };
};