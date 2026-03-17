import React, { useEffect, useState } from 'react';
import { UI_THEME } from '../../constants';

// Sub-components
import AlbumList from './AlbumList';
import AlbumDetail from './AlbumDetail';
import SharedAlbums from './SharedAlbums';
import StandardAppLayout from '../../components/common/layout/StandardAppLayout';

export default function Photos({ theme, cycleTheme, user, login }) {
  const [view, setView] = useState('list'); // 'list' | 'detail' | 'shared'
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [sharedIds, setSharedIds] = useState(null);
  const [isExternalShare, setIsExternalShare] = useState(false); // 是否為外部直接分享連結進入 (家長/觀看模式)

  useEffect(() => {
    // 簡單的路由解析
    const params = new URLSearchParams(window.location.search);
    const albumId = params.get('album');
    const shared = params.get('albums'); // 多個ID, e.g. ?albums=abc,def

    if (shared) {
      setSharedIds(shared);
      setView('shared');
      setIsExternalShare(true);
    } else if (albumId) {
      setActiveFolderId(albumId);
      setView('detail');
      setIsExternalShare(true);
    } else {
      setView('list');
      setActiveFolderId(null);
      setSharedIds(null);
      setIsExternalShare(false);
    }
  }, []); // 取決於元件是否會在 URL 變更時重新掛載，通常 ClassroomOS 中點擊切換 app 會重新掛載或只根據 state 改變

  const renderView = () => {
    switch (view) {
      case 'detail':
        return (
          <AlbumDetail 
            folderId={activeFolderId} 
            isSharedView={isExternalShare}
            onBack={isExternalShare ? null : (() => setView('list'))} 
          />
        );
      case 'shared':
        return <SharedAlbums ids={sharedIds} />;
      case 'list':
      default:
        return <AlbumList onSelectAlbum={(id) => {
          setActiveFolderId(id);
          setView('detail');
          setIsExternalShare(false); // 從列表進入不算外部直接分享
        }} />;
    }
  };

  return (
    <StandardAppLayout
      sidebar={null}
      header={null}
    >
      <div className={`flex flex-col flex-1 min-w-0 w-full h-full relative ${UI_THEME.CONTENT_AREA} overflow-y-auto print:overflow-visible print:block`}>
        {renderView()}
      </div>
    </StandardAppLayout>
  );
}
