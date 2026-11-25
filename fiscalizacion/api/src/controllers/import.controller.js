import * as importService from '../services/import.service.js';
export const importData = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        await importService.importDataFromXlsx(req.file.buffer);
        res.json({ message: 'Data imported successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=import.controller.js.map