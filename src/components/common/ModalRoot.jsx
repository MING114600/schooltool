import React from 'react';
import { useModalContext } from '../../context/ModalContext';
import { useClassroomStore } from '../../store/useClassroomStore';
import { useAuth } from '../../context/AuthContext';
import { MODAL_ID } from '../../constants';

// --- Global Modals ---
import DialogModal from './DialogModal';
import GlobalBackupModal from './GlobalBackupModal';

// --- Manager Modals ---
import LayoutTemplateModal from '../../pages/Manager/modals/LayoutTemplateModal';
import EditStudentModal from '../../pages/Manager/modals/EditStudentModal';
import BatchGroupModal from '../../pages/Manager/modals/BatchGroupModal';
import AttendanceModal from '../../pages/Manager/modals/AttendanceModal';
import ScoringModal from '../../pages/Manager/modals/ScoringModal';
import BehaviorSettingsModal from '../../pages/Manager/modals/BehaviorSettingsModal';
import ExportStatsModal from '../../pages/Manager/modals/ExportStatsModal';

const ModalRoot = () => {
    const {
        isModalOpen, closeModal, modalData,
        dialogConfig, closeDialog, openDialog
    } = useModalContext();

    const classes = useClassroomStore(state => state.classes);
    const currentClassId = useClassroomStore(state => state.currentClassId);
    const currentClass = classes.find(c => c.id === currentClassId);
    const templates = useClassroomStore(state => state.templates);
    const setHoveredGroup = useClassroomStore(state => state.setHoveredGroup);

    const saveTemplate = useClassroomStore(state => state.saveTemplate);
    const deleteTemplate = useClassroomStore(state => state.deleteTemplate);
    const applyTemplate = useClassroomStore(state => state.applyTemplate);
    const updateStudent = useClassroomStore(state => state.updateStudent);
    const updateStudents = useClassroomStore(state => state.updateStudents);
    const scoreStudent = useClassroomStore(state => state.scoreStudent);
    const resetScores = useClassroomStore(state => state.resetScores);
    const updateBehaviors = useClassroomStore(state => state.updateBehaviors);
    const updateAttendance = useClassroomStore(state => state.updateAttendance);

    const { user, login } = useAuth();

    // 封裝共用的 Dialog 觸發函式
    const handleShowDialog = (config) => {
        openDialog({
            ...config,
            onConfirm: (result) => {
                if (config.onConfirm) config.onConfirm(result);
                closeDialog();
            }
        });
    };

    return (
        <>
            <LayoutTemplateModal
                isOpen={isModalOpen(MODAL_ID.LAYOUT_TEMPLATE)} onClose={closeModal}
                currentLayout={currentClass?.layout} templates={templates}
                onApplyTemplate={applyTemplate} onSaveTemplate={saveTemplate} onDeleteTemplate={deleteTemplate}
                onShowDialog={handleShowDialog}
            />
            <EditStudentModal
                isOpen={isModalOpen(MODAL_ID.EDIT_STUDENT)} onClose={closeModal}
                student={modalData} onSave={updateStudent}
            />
            <BatchGroupModal
                isOpen={isModalOpen(MODAL_ID.BATCH_GROUP)} onClose={closeModal}
                students={currentClass?.students} onUpdateStudents={updateStudents}
                onShowDialog={handleShowDialog}
            />
            <AttendanceModal
                isOpen={isModalOpen(MODAL_ID.ATTENDANCE)} onClose={closeModal}
                students={currentClass?.students} attendanceRecords={currentClass?.attendanceRecords}
                onSave={updateAttendance}
                onShowDialog={handleShowDialog}
            />
            <ScoringModal
                isOpen={isModalOpen(MODAL_ID.SCORING)} student={modalData?.student || modalData}
                behaviors={currentClass?.behaviors}
                onClose={() => { closeModal(); if (setHoveredGroup) setHoveredGroup(null); }}
                onScore={scoreStudent} defaultMode={modalData?.mode || 'individual'}
            />
            <BehaviorSettingsModal
                isOpen={isModalOpen(MODAL_ID.BEHAVIOR_SETTINGS)} onClose={closeModal}
                behaviors={currentClass?.behaviors} onUpdateBehaviors={updateBehaviors} onResetScores={resetScores}
                onShowDialog={handleShowDialog}
            />
            <ExportStatsModal
                isOpen={isModalOpen(MODAL_ID.EXPORT_STATS)} onClose={closeModal}
                students={currentClass?.students} groupScores={currentClass?.groupScores}
                attendanceRecords={currentClass?.attendanceRecords || {}} onResetScores={resetScores}
                onShowDialog={handleShowDialog}
            />

            <GlobalBackupModal
                isOpen={isModalOpen('global_backup')}
                onClose={closeModal}
                user={user}
                login={login}
            />

            {/* 統一渲染 DialogModal */}
            {dialogConfig && dialogConfig.isOpen && (
                <DialogModal
                    {...dialogConfig}
                    onClose={() => {
                        if (dialogConfig.onClose) dialogConfig.onClose();
                        closeDialog();
                    }}
                />
            )}
        </>
    );
};

export default ModalRoot;
