import { useState, useEffect, useRef, useCallback } from 'react';
import { useHotkeys } from '../../../hooks/useHotkeys';

export const useManagerUI = ({
    currentClass,
    activeModal, closeModal,
    dialogConfig, closeDialog,
    toggleFullscreen,
    canUndo, undo,
    canRedo, redo,
    setSeatMode
}) => {
    // --- UI 狀態 ---
    const [isTeacherView, setIsTeacherView] = useState(false);
    const [isEditingList, setIsEditingList] = useState(false);
    const [showShuffleMenu, setShowShuffleMenu] = useState(false);
    const [displayMode, setDisplayMode] = useState('group');
    const [appMode, setAppMode] = useState('score');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState('management');
    const [isSoundBoardOpen, setIsSoundBoardOpen] = useState(false);
    const [isTimerOpen, setIsTimerOpen] = useState(false);
    const [isLotteryOpen, setIsLotteryOpen] = useState(false);
    const [isScoreTickerOpen, setIsScoreTickerOpen] = useState(true);
    const [batchScoreMode, setBatchScoreMode] = useState(null);

    const [hoveredGroup, setHoveredGroup] = useState(null);
    const [scale, setScale] = useState(1);

    const gridRef = useRef(null);
    const containerRef = useRef(null);

    // --- 熱鍵綁定 ---
    useHotkeys({
        // 1. 視窗控制
        'escape': () => {
            if (activeModal) {
                closeModal();
            } else if (dialogConfig) {
                closeDialog();
            } else if (isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        },
        'f': () => toggleFullscreen(),

        // 2. 編輯歷史 (Undo/Redo)
        'ctrl+z': () => { if (canUndo) undo(); },
        'ctrl+y': () => { if (canRedo) redo(); },
        'ctrl+shift+z': () => { if (canRedo) redo(); },

        // 3. 模式切換 (Alt + Number)
        'alt+1': () => {
            setAppMode('score');
            setBatchScoreMode(null);
        },
        'alt+2': () => {
            setAppMode('arrange');
            setBatchScoreMode(null);
        },

        // 4. 編輯模式下的工具切換
        's': () => { if (appMode === 'arrange') setSeatMode('swap'); },
        'r': () => { if (appMode === 'arrange') setSeatMode('replace'); }
    });

    // --- 縮放與模式自動切換邏輯 ---
    useEffect(() => {
        if (currentClass?.students) {
            const hasGroups = currentClass.students.some(s => s.group && String(s.group).trim() !== '');
            setDisplayMode(hasGroups ? 'group' : 'normal');
        }
    }, [currentClass?.id]); // 修正為 currentClass?.id 以防 undefined

    // --- Resize Observer ---
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                const scaleX = clientWidth / 1200;
                const scaleY = clientHeight / 800;
                setScale(Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 1.2));
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarOpen]);

    // --- 提供給 Toolbar 的快捷切換邏輯 ---
    const handleSwitchMode = useCallback((mode) => {
        setAppMode(mode);
        setBatchScoreMode(null);
    }, []);

    const cycleDisplayMode = useCallback(() => {
        setDisplayMode(prev => ({ normal: 'gender', gender: 'group', group: 'normal' }[prev]));
    }, []);

    const getDisplayModeLabel = useCallback(() => {
        return { normal: '一般', gender: '性別', group: '小組' }[displayMode];
    }, [displayMode]);

    const toggleBatchMode = useCallback((mode) => {
        setBatchScoreMode(prev => prev === mode ? null : mode);
    }, []);

    return {
        state: {
            isTeacherView, isEditingList, showShuffleMenu, displayMode, appMode,
            isSidebarOpen, sidebarTab, isSoundBoardOpen, isTimerOpen,
            isLotteryOpen, isScoreTickerOpen, batchScoreMode, hoveredGroup, scale
        },
        setters: {
            setIsTeacherView, setIsEditingList, setShowShuffleMenu, setDisplayMode, setAppMode,
            setIsSidebarOpen, setSidebarTab, setIsSoundBoardOpen, setIsTimerOpen,
            setIsLotteryOpen, setIsScoreTickerOpen, setBatchScoreMode, setHoveredGroup
        },
        actions: {
            handleSwitchMode, cycleDisplayMode, getDisplayModeLabel, toggleBatchMode
        },
        refs: {
            gridRef, containerRef
        }
    };
};
