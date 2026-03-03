import React from 'react';
import { ToggleLeft } from 'lucide-react';
import { UI_THEME } from '../../../../constants';
import SettingsSection from './SettingsSection';

const ButtonSettings = ({ 
  visibleButtons, 
  setVisibleButtons, 
  systemButtonsConfig, 
  isOpen, 
  onToggle 
}) => {
  
  const toggleButtonVisibility = (btnId) => {
    if (visibleButtons.includes(btnId)) {
      setVisibleButtons(visibleButtons.filter(id => id !== btnId));
    } else {
      setVisibleButtons([...visibleButtons, btnId]);
    }
  };

  return (
    <SettingsSection 
      title="控制列按鈕管理" 
      icon={ToggleLeft} 
      theme="emerald" 
      isOpen={isOpen} 
      onToggle={onToggle}
    >
      <div className="space-y-4">
        <p className={`text-xs ${UI_THEME.TEXT_MUTED}`}>點擊切換控制列上顯示的功能按鈕：</p>
        
        {/* 單獨按鈕區 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {systemButtonsConfig.singles.map(btn => (
            <button
              key={btn.id}
              onClick={() => toggleButtonVisibility(btn.id)}
              className={`p-3 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all ${
				visibleButtons.includes(btn.id)
				  ? `
					bg-emerald-100 dark:bg-emerald-900/40
					border-emerald-500 dark:border-emerald-400
					text-emerald-800 dark:text-emerald-200
					ring-2 ring-emerald-400/40 dark:ring-emerald-300/40
					`
				  : `
					bg-transparent
					border-slate-200 dark:border-slate-700
					text-slate-400
					opacity-60
					`
              }`}
            >
              <btn.icon size={16} />
              {btn.label}
            </button>
          ))}
        </div>

        {/* 群組按鈕區 (如：模式切換) */}
        {systemButtonsConfig.groups.map(group => (
          <div key={group.id} className="space-y-2">
            <h4 className={`text-xs font-bold ${UI_THEME.TEXT_MUTED} uppercase`}>{group.label}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {group.items.map(btn => (
                <button
                  key={btn.id}
                  onClick={() => toggleButtonVisibility(btn.id)}
                  className={`p-3 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all ${
				visibleButtons.includes(btn.id)
				  ? `
					bg-emerald-100 dark:bg-emerald-900/40
					border-emerald-500 dark:border-emerald-400
					text-emerald-800 dark:text-emerald-200
					ring-2 ring-emerald-400/40 dark:ring-emerald-300/40
					`
				  : `
					bg-transparent
					border-slate-200 dark:border-slate-700
					text-slate-400
					opacity-60
					`
						}`}
                >
                  <btn.icon size={16} />
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
};

export default ButtonSettings;