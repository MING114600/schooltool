// src/utils/googlePickerService.js
// Google Drive Picker API 封裝模組
// 讓使用者可以透過官方的檔案選取視窗選擇「與我共用」的試算表
// 選取後，drive.file scope 會自動延伸覆蓋該檔案

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
// App ID = Google Cloud 專案的專案編號 (即 OAuth Client ID 的前段數字)
const APP_ID = '831574445055';

let isPickerApiLoaded = false;

/**
 * 動態載入 Google Picker API 腳本
 * @returns {Promise<void>}
 */
const loadPickerApi = () => {
    return new Promise((resolve, reject) => {
        if (isPickerApiLoaded) {
            resolve();
            return;
        }

        // 檢查 gapi 是否已被載入
        if (window.gapi) {
            window.gapi.load('picker', {
                callback: () => {
                    isPickerApiLoaded = true;
                    resolve();
                },
                onerror: () => reject(new Error('Google Picker API 載入失敗'))
            });
            return;
        }

        // 第一次載入：插入 gapi script 標籤
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.gapi.load('picker', {
                callback: () => {
                    isPickerApiLoaded = true;
                    resolve();
                },
                onerror: () => reject(new Error('Google Picker API 載入失敗'))
            });
        };
        script.onerror = () => reject(new Error('gapi script 載入失敗'));
        document.body.appendChild(script);
    });
};

/**
 * 開啟 Google Drive 檔案選取器
 * 只顯示試算表類型的檔案，並包含「與我共用」的分頁
 *
 * @param {string} accessToken - 使用者的 Google OAuth Access Token
 * @returns {Promise<{id: string, name: string, url: string} | null>}
 *          使用者選取的檔案資訊，取消則回傳 null
 */
export const openSpreadsheetPicker = async (accessToken) => {
    await loadPickerApi();

    return new Promise((resolve) => {
        const google = window.google;

        // 視圖 1: 我的雲端硬碟中的試算表
        const myDriveView = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS)
            .setIncludeFolders(true)
            .setSelectFolderEnabled(false);

        // 視圖 2: 與我共用的試算表 (這是教師 B 會用到的核心視圖)
        const sharedWithMeView = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS)
            .setIncludeFolders(true)
            .setSelectFolderEnabled(false)
            .setOwnedByMe(false); // 關鍵：只顯示別人分享給我的

        const picker = new google.picker.PickerBuilder()
            .setTitle('選擇要匯入的共編個案試算表')
            .addView(sharedWithMeView)  // 預設顯示「與我共用」
            .addView(myDriveView)       // 也可以切換到「我的雲端」
            .setOAuthToken(accessToken)
            .setDeveloperKey(API_KEY)
            .setAppId(APP_ID)
            .setCallback((data) => {
                if (data.action === google.picker.Action.PICKED) {
                    const doc = data.docs[0];
                    resolve({
                        id: doc.id,
                        name: doc.name,
                        url: doc.url
                    });
                } else if (data.action === google.picker.Action.CANCEL) {
                    resolve(null);
                }
            })
            .setSize(900, 550)
            .build();

        picker.setVisible(true);
    });
};
