import React from 'react';
import { ChevronDown } from 'lucide-react';
// 引入全域主題與小組配色
import { UI_THEME, GROUP_THEME } from '../../../../constants';

const SettingsSection = ({ children }) => {
  return (
    <div className="w-full animate-in fade-in duration-300">
      {children}
    </div>
  );
};

export default SettingsSection;