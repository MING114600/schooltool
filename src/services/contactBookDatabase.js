import { saveItem, getAllItems, getItem, deleteItem, STORES } from './idbService';

export const contactBookDB = {
    // --- Logs ---
    saveLog: async (log) => {
        return await saveItem(STORES.CONTACT_BOOK_LOGS, log);
    },
    getAllLogs: async () => {
        return await getAllItems(STORES.CONTACT_BOOK_LOGS);
    },
    deleteLog: async (id) => {
        return await deleteItem(STORES.CONTACT_BOOK_LOGS, id);
    },

    // --- Templates ---
    saveTemplate: async (template) => {
        return await saveItem(STORES.CONTACT_BOOK_TEMPLATES, template);
    },
    getAllTemplates: async () => {
        return await getAllItems(STORES.CONTACT_BOOK_TEMPLATES);
    },
    deleteTemplate: async (id) => {
        return await deleteItem(STORES.CONTACT_BOOK_TEMPLATES, id);
    },

    // --- Template Visibility (Metadata) ---
    getHiddenTemplateIds: async () => {
        const data = await getItem(STORES.METADATA, 'hidden_contact_book_templates');
        return data?.ids || [];
    },
    saveHiddenTemplateIds: async (ids) => {
        return await saveItem(STORES.METADATA, { id: 'hidden_contact_book_templates', ids });
    }
};
