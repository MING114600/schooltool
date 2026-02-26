// src/hooks/useExamCloud.js
import { useState, useEffect, useRef } from 'react'; // 🌟 新增 useRef
import { shareExamToCloud, downloadSharedExam } from '../utils/googleDriveService';
import { saveExam } from '../utils/examDatabase';

export const useExamCloud = ({ 
  user, 
  login, 
  shareId, 
  setShareId, 
  setAlertDialog, 
  onDownloadSuccess,
  onStartFocusMode  
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareModalData, setShareModalData] = useState({ isOpen: false, shareId: null, title: '' });
  const processedId = useRef(null);

  const GOOGLE_API_KEY = "AIzaSyAZZ89XM6eE1ILdsscbILaS0C2fiWEh_-M"; // 您的 API Key

  // 🌟 1. 學生端：偵測 shareId 並自動下載
  useEffect(() => {
    const fetchSharedExam = async () => {
     if (!shareId || processedId.current === shareId) return;

      setIsDownloading(true);
      try {
        const sharedData = await downloadSharedExam(shareId, GOOGLE_API_KEY);

        if (sharedData) {
          // 處理發音字典
          if (sharedData.customDict) {
            const dictValue = typeof sharedData.customDict === 'string' 
              ? sharedData.customDict 
              : JSON.stringify(sharedData.customDict);
            localStorage.setItem('tts_custom_dict', dictValue);
          }

          let examsToSave = sharedData.type === 'exam_package' ? sharedData.exams : [sharedData];
          let displayTitle = sharedData.type === 'exam_package' ? sharedData.packageTitle : (sharedData.title || '未命名考卷');

          let firstExamId = '';
          for (const exam of examsToSave) {
            const sid = `shared_${exam.id || Date.now()}`;
            if (!firstExamId) firstExamId = sid;
            
            await saveExam({
              ...exam,
              id: sid,
              isShared: true,
              downloadAt: new Date().toISOString()
            });
          }

          // 呼叫父元件的成功回呼函式 (重新讀取清單並切換)
          if (onDownloadSuccess) {
            await onDownloadSuccess(firstExamId);
          }

          setAlertDialog({
            isOpen: true,
            title: '下載並儲存成功',
            message: `已成功載入：${displayTitle}\n包含 ${examsToSave.length} 份考卷。資料已存入本機，可離線使用。`,
            type: 'alert',
            variant: 'success',
            confirmText: '開始考試',
            onConfirm: () => {
              setAlertDialog(prev => ({ ...prev, isOpen: false }));
              // 🌟 3. 在這裡呼叫：學生點擊開始考試時，進入專注模式！
              if (onStartFocusMode) onStartFocusMode(); 
            }
          });

          window.history.replaceState({}, document.title, window.location.pathname);
          if (setShareId) setShareId(null); 
        }
      } catch (error) {
        console.error("下載失敗:", error);
        setAlertDialog({
          isOpen: true,
          title: '載入失敗',
          message: '無法獲取考卷，請檢查連結是否正確或網路是否通暢。',
          type: 'alert',
          variant: 'danger',
          onConfirm: () => setAlertDialog(prev => ({ ...prev, isOpen: false }))
        });
      } finally {
        setIsDownloading(false);
      }
    };

    fetchSharedExam();
  }, [shareId]);

  // 🌟 2. 老師端：處理考卷包派送
  const handlePackageShare = async (fullExams, displayTitle, cloudFileName) => {
    if (!user) {
      login();
      return;
    }

    setIsSharing(true);
    try {
      const localDict = localStorage.getItem('tts_custom_dict');
      let parsedDict = null;
      if (localDict) {
        try { parsedDict = JSON.parse(localDict); } catch (e) { parsedDict = localDict; }
      }

      const packagePayload = {
        type: 'exam_package',
        version: '4.0',
        timestamp: new Date().toISOString(),
        packageTitle: displayTitle, // 🌟 使用傳入的標題 (單份名稱 或 派送包名稱)
        exams: fullExams,
        customDict: parsedDict 
      };

      // 🌟 呼叫 Service 時，傳入計算好的 cloudFileName
      const newShareId = await shareExamToCloud(user.accessToken, packagePayload, cloudFileName);
      
      // 🌟 更新 QR Code 彈窗的標題
      setShareModalData({ isOpen: true, shareId: newShareId, title: displayTitle });
    } catch (error) {
      console.error("打包派送失敗:", error);
      
      // 🌟 關鍵修正：確保這裡能捕捉 TokenExpired 並彈出對話框
      if (error.message === 'TokenExpired') {
        setAlertDialog({
          isOpen: true,
          title: '登入安全時效已過',
          message: '為保護您的雲端資料安全，Google 登入憑證已過期。請點擊下方按鈕重新登入。',
          type: 'confirm',
          variant: 'warning',
          confirmText: '重新登入',
          onConfirm: () => {
            setAlertDialog(prev => ({ ...prev, isOpen: false }));
            setTimeout(() => login(), 100); // 呼叫登入
          }
        });
      } else {
        setAlertDialog({
          isOpen: true,
          title: '派送失敗',
          message: '建立派送包失敗，請檢查網路連線。',
          type: 'alert',
          variant: 'danger',
          onConfirm: () => setAlertDialog(prev => ({ ...prev, isOpen: false }))
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  return {
    isSharing,
    isDownloading,
    shareModalData,
    setShareModalData,
    handlePackageShare
  };
};