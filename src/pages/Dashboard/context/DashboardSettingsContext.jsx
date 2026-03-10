import React, { createContext, useContext, useMemo } from 'react';
import usePersistentState from '../../../hooks/usePersistentState';
import {
    DEFAULT_SCHEDULE, DEFAULT_SUBJECT_HINTS,
    DEFAULT_DAY_TYPES, SYSTEM_BUTTONS_CONFIG, DEFAULT_CUSTOM_BROADCASTS,
    DEFAULT_WEATHER_CONFIG
} from '../utils/dashboardConstants';
import { STANDARD_TIME_SLOTS } from '../../../constants';

const DashboardSettingsContext = createContext();

export const DashboardSettingsProvider = ({ children }) => {
    const [timeSlots, setTimeSlots] = usePersistentState('timeSlots', STANDARD_TIME_SLOTS);
    const [schedule, setSchedule] = usePersistentState('schedule', DEFAULT_SCHEDULE);
    const [subjectHints, setSubjectHints] = usePersistentState('subjectHints', DEFAULT_SUBJECT_HINTS);
    const [is24Hour, setIs24Hour] = usePersistentState('is24Hour', true);
    const [dayTypes, setDayTypes] = usePersistentState('dayTypes', DEFAULT_DAY_TYPES);
    const [customPresets, setCustomPresets] = usePersistentState('customPresets', DEFAULT_CUSTOM_BROADCASTS);

    const [visibleButtons, setVisibleButtons] = usePersistentState('visibleButtons', () => [
        ...SYSTEM_BUTTONS_CONFIG.singles.map(b => b.id),
        ...SYSTEM_BUTTONS_CONFIG.groups.flatMap(g => g.items.map(b => b.id))
    ]);

    const [weatherConfig, setWeatherConfig] = usePersistentState('weatherConfig', DEFAULT_WEATHER_CONFIG);

    const contextValue = useMemo(() => ({
        timeSlots, setTimeSlots,
        schedule, setSchedule,
        subjectHints, setSubjectHints,
        is24Hour, setIs24Hour,
        dayTypes, setDayTypes,
        customPresets, setCustomPresets,
        visibleButtons, setVisibleButtons,
        weatherConfig, setWeatherConfig
    }), [
        timeSlots, setTimeSlots,
        schedule, setSchedule,
        subjectHints, setSubjectHints,
        is24Hour, setIs24Hour,
        dayTypes, setDayTypes,
        customPresets, setCustomPresets,
        visibleButtons, setVisibleButtons,
        weatherConfig, setWeatherConfig
    ]);

    return (
        <DashboardSettingsContext.Provider value={contextValue}>
            {children}
        </DashboardSettingsContext.Provider>
    );
};

export const useDashboardSettings = () => {
    const context = useContext(DashboardSettingsContext);
    if (context === undefined) {
        throw new Error('useDashboardSettings must be used within a DashboardSettingsProvider');
    }
    return context;
};
