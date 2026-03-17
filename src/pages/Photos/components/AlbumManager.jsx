import React, { useState } from 'react';
import { Plus, Link, Loader2, AlertCircle, Share2, Trash2, CheckSquare, Square, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { UI_THEME } from '../../../constants';
import usePhotoStore from '../../../store/usePhotoStore';
import { extractDriveId } from '../../../utils/driveUtils';
import { validatePublicFolder } from '../../../services/googleDriveService';
import { useModalContext } from '../../../context/ModalContext';

export default function AlbumManager({ onGenerateShareLink }) {
  const [url, setUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false); // collapsed by default

  const managedAlbums = usePhotoStore(state => state.managedAlbums);
  const addManagedAlbum = usePhotoStore(state => state.addManagedAlbum);
  const removeManagedAlbum = usePhotoStore(state => state.removeManagedAlbum);

  const [selectedIds, setSelectedIds] = useState([]);
  const { openDialog, closeDialog } = useModalContext();
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  const handleAddAlbum = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setErrorMsg('');
    const folderId = extractDriveId(url);
    if (!folderId) { setErrorMsg('無法解析網址，請確認是正確的 Google Drive 資料夾連結。'); return; }
    if (managedAlbums.some(a => a.folderId === folderId)) { setErrorMsg('此相簿已經在管理清單中了。'); return; }

    setIsAdding(true);
    try {
      if (!apiKey) throw new Error('系統未設定 API Key，無法讀取雲端硬碟。');
      const validation = await validatePublicFolder(folderId, apiKey);
      if (!validation.isValid) throw new Error(validation.error || '驗證失敗，請確認資料夾是否設為「知道這個連結的任何人都能查看」。');
      addManagedAlbum({ folderId, title: validation.folderName || '未命名相簿', coverImage: null, status: 'active', createdAt: Date.now() });
      setUrl('');
      // Auto expand panel to show newly added album
      setIsPanelOpen(true);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleSelect = (folderId) => {
    setSelectedIds(prev => prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === managedAlbums.length ? [] : managedAlbums.map(a => a.folderId));
  };

  const handleShare = () => {
    if (selectedIds.length === 0) return;
    onGenerateShareLink(selectedIds);
  };

  const allSelected = managedAlbums.length > 0 && selectedIds.length === managedAlbums.length;

  return (
    <div className={`mb-10 rounded-2xl border-l-4 border-l-indigo-400 dark:border-l-indigo-500 border ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_MAIN} shadow-sm overflow-hidden`}>
      {/* ── Accordion Header ── */}
      <button
        onClick={() => setIsPanelOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-stone-50 dark:hover:bg-zinc-800/60 transition-colors`}
      >
        <div className="flex items-center gap-3">
          <Settings2 size={18} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
          <span className={`font-bold text-base ${UI_THEME.TEXT_PRIMARY}`}>後台管理</span>
          <span className={`text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300`}>
            {managedAlbums.length} 本相簿
          </span>
        </div>
        {isPanelOpen
          ? <ChevronUp size={18} className={UI_THEME.TEXT_MUTED} />
          : <ChevronDown size={18} className={UI_THEME.TEXT_MUTED} />
        }
      </button>

      {/* ── Collapsible Body ── */}
      <div className={`transition-all duration-300 overflow-hidden ${isPanelOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-6 pt-2">
          {/* Add Album Form */}
          <form onSubmit={handleAddAlbum} className="flex flex-col gap-3 md:flex-row mb-4">
            <div className="relative flex-1">
              <Link className={`absolute left-4 top-1/2 -translate-y-1/2 ${UI_THEME.TEXT_MUTED}`} size={18} />
              <input
                type="text"
                placeholder="請貼上 Google Drive 公開資料夾連結..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isAdding}
                className={`w-full pl-11 pr-4 py-3 rounded-xl ${UI_THEME.INPUT_BASE} transition-all`}
              />
            </div>
            <button
              type="submit"
              disabled={!url.trim() || isAdding}
              className={`flex items-center justify-center min-w-[110px] gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-sm ${
                !url.trim() || isAdding
                  ? 'bg-stone-200 text-stone-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              {isAdding ? '驗證中...' : '新增'}
            </button>
          </form>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Managed Albums List */}
          <div className={`border-t ${UI_THEME.BORDER_DEFAULT} pt-4 mt-4`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <h3 className={`font-bold text-sm ${UI_THEME.TEXT_SECONDARY}`}>已管理相簿</h3>
                {managedAlbums.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                      allSelected
                        ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : `${UI_THEME.TEXT_MUTED} hover:bg-stone-100 dark:hover:bg-zinc-700`
                    }`}
                  >
                    {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                    全選
                  </button>
                )}
              </div>
              <button
                onClick={handleShare}
                disabled={selectedIds.length === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  selectedIds.length > 0
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
                    : `bg-stone-100 ${UI_THEME.TEXT_MUTED} cursor-not-allowed dark:bg-zinc-800`
                }`}
              >
                <Share2 size={14} /> 產生分享連結 ({selectedIds.length})
              </button>
            </div>

            {managedAlbums.length === 0 ? (
              <div className={`text-center py-6 text-sm ${UI_THEME.TEXT_MUTED}`}>
                目前還沒有相簿，請貼上連結來新增。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {managedAlbums.map((album) => (
                  <div
                    key={album.folderId}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedIds.includes(album.folderId)
                        ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-900/10'
                        : `border-stone-200 bg-white hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-indigo-500/40`
                    }`}
                    onClick={() => toggleSelect(album.folderId)}
                  >
                    {/* Cover thumbnail */}
                    <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-stone-100 dark:bg-zinc-700 flex items-center justify-center">
                      {album.coverImage
                        ? <img src={album.coverImage} alt={album.title} className="w-full h-full object-cover" />
                        : <span className={`text-xs font-bold ${selectedIds.includes(album.folderId) ? 'text-indigo-500' : UI_THEME.TEXT_MUTED}`}>
                            {album.title.charAt(0)}
                          </span>
                      }
                    </div>

                    {/* Checkbox */}
                    <div className={`shrink-0 ${selectedIds.includes(album.folderId) ? 'text-indigo-500' : 'text-stone-400 dark:text-zinc-500'}`}>
                      {selectedIds.includes(album.folderId) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm truncate ${UI_THEME.TEXT_PRIMARY}`}>{album.title}</div>
                      <div className={`text-xs truncate ${UI_THEME.TEXT_MUTED}`}>ID: {album.folderId.substring(0, 10)}...</div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDialog({
                          title: '移除相簿',
                          message: '確定要移除此相簿嗎？（不影響雲端硬碟檔案）',
                          type: 'confirm',
                          variant: 'danger',
                          onConfirm: () => {
                            removeManagedAlbum(album.folderId);
                            setSelectedIds(prev => prev.filter(id => id !== album.folderId));
                            closeDialog();
                          }
                        });
                      }}
                      className="p-2 shrink-0 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                      title="移除相簿"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
