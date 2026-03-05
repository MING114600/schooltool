// src/pages/CaseLog/views/components/ShareManagerModal.jsx
// 共編管理彈窗：顯示已分享名單、新增分享、移除權限
import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, Loader2, Users, Shield, X, Mail, CheckCircle2 } from 'lucide-react';
import { UI_THEME } from '../../../../constants';
import { shareSheetWithEmail, getSharedPermissions, removeSharedPermission } from '../../../../services/googleDriveService';

const ShareManagerModal = ({ isOpen, onClose, sheetId, token, ownerEmail }) => {
    const [permissions, setPermissions] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

    // 讀取目前的權限清單
    const loadPermissions = useCallback(async () => {
        if (!sheetId || !token) return;
        setIsLoading(true);
        try {
            const perms = await getSharedPermissions(token, sheetId);
            // 篩掉 owner 自己 和 anyoneWithLink
            const filtered = perms.filter(p =>
                p.emailAddress &&
                p.emailAddress !== ownerEmail &&
                p.type === 'user' &&
                p.role === 'writer'
            );
            setPermissions(filtered);
        } catch (err) {
            console.error('讀取權限清單失敗:', err);
        } finally {
            setIsLoading(false);
        }
    }, [sheetId, token, ownerEmail]);

    useEffect(() => {
        if (isOpen) {
            loadPermissions();
            setFeedback(null);
            setNewEmail('');
        }
    }, [isOpen, loadPermissions]);

    // 新增分享
    const handleShare = async () => {
        const email = newEmail.trim().toLowerCase();
        if (!email || !email.includes('@')) return;

        // 防止分享給自己
        if (email === ownerEmail?.toLowerCase()) {
            setFeedback({ type: 'error', message: '不需要跟自己分享喔！' });
            return;
        }

        setIsSharing(true);
        setFeedback(null);
        try {
            await shareSheetWithEmail(token, sheetId, email);
            setFeedback({ type: 'success', message: `已成功分享給 ${email}` });
            setNewEmail('');
            await loadPermissions(); // 重新整理清單
        } catch (err) {
            setFeedback({ type: 'error', message: `分享失敗：${err.message || '請確認 Email 是否正確'}` });
        } finally {
            setIsSharing(false);
        }
    };

    // 移除權限
    const handleRemove = async (permissionId, email) => {
        setRemovingId(permissionId);
        setFeedback(null);
        try {
            await removeSharedPermission(token, sheetId, permissionId);
            setFeedback({ type: 'success', message: `已撤銷 ${email} 的存取權限` });
            await loadPermissions();
        } catch (err) {
            setFeedback({ type: 'error', message: `撤銷失敗：${err.message}` });
        } finally {
            setRemovingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl border ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_MAIN} overflow-hidden`}>
                {/* 標頭 */}
                <div className={`px-6 py-4 border-b ${UI_THEME.BORDER_DEFAULT} flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-500`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Users size={22} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">共編管理</h3>
                            <p className="text-xs text-white/80">管理有權編輯此日誌的教師</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 內容區 */}
                <div className="p-6 flex flex-col gap-5">

                    {/* 回饋訊息 */}
                    {feedback && (
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold animate-in slide-in-from-top duration-200 ${feedback.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            }`}>
                            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <Shield size={16} />}
                            {feedback.message}
                        </div>
                    )}

                    {/* 已分享清單 */}
                    <div>
                        <span className={`text-xs font-bold ${UI_THEME.TEXT_MUTED} mb-3 block`}>
                            目前的共編者 ({permissions.length} 人)
                        </span>

                        {isLoading ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="animate-spin text-slate-400" size={24} />
                            </div>
                        ) : permissions.length === 0 ? (
                            <div className={`text-center py-6 text-sm font-bold ${UI_THEME.TEXT_MUTED} bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed ${UI_THEME.BORDER_DEFAULT}`}>
                                尚未分享給任何教師
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                {permissions.map((perm) => (
                                    <div
                                        key={perm.id}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl border ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_CARD} hover:shadow-sm transition-shadow`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                                <Mail size={14} className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <span className={`text-sm font-bold ${UI_THEME.TEXT_PRIMARY}`}>
                                                    {perm.emailAddress}
                                                </span>
                                                <span className={`block text-xs ${UI_THEME.TEXT_MUTED}`}>
                                                    {perm.role === 'writer' ? '可編輯' : perm.role}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(perm.id, perm.emailAddress)}
                                            disabled={removingId === perm.id}
                                            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                                            title="移除此教師的存取權限"
                                        >
                                            {removingId === perm.id
                                                ? <Loader2 size={16} className="animate-spin" />
                                                : <Trash2 size={16} />
                                            }
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 新增分享 */}
                    <div>
                        <span className={`text-xs font-bold ${UI_THEME.TEXT_MUTED} mb-2 block`}>
                            新增共編教師
                        </span>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                                placeholder="輸入教師的 Google Email..."
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold ${UI_THEME.INPUT_BASE}`}
                                disabled={isSharing}
                            />
                            <button
                                onClick={handleShare}
                                disabled={isSharing || !newEmail.trim()}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shrink-0 transition-all ${isSharing || !newEmail.trim()
                                    ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow-md'
                                    }`}
                            >
                                {isSharing
                                    ? <Loader2 size={16} className="animate-spin" />
                                    : <UserPlus size={16} />
                                }
                                分享
                            </button>
                        </div>
                    </div>

                    {/* 提示文字 */}
                    <p className={`text-xs ${UI_THEME.TEXT_MUTED} leading-relaxed bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-dashed ${UI_THEME.BORDER_DEFAULT}`}>
                        💡 分享後，對方需要在自己的系統中點擊「匯入共有學生」，並從 Google 雲端硬碟中選取此檔案，即可開始共同編輯日誌。
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShareManagerModal;
