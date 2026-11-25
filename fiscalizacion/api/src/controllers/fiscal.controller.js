import * as fiscalService from '../services/fiscal.service.js';
export const getFiscales = async (req, res) => {
    try {
        const fiscales = await fiscalService.getAllFiscales();
        res.json(fiscales);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const createFiscal = async (req, res) => {
    try {
        const newFiscal = await fiscalService.createFiscal(req.body);
        res.status(201).json(newFiscal);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const updateFiscal = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id)
            return res.status(400).json({ error: 'Parámetro id requerido' });
        const updatedFiscal = await fiscalService.updateFiscal(id, req.body);
        res.json(updatedFiscal);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const deleteFiscal = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id)
            return res.status(400).json({ error: 'Parámetro id requerido' });
        await fiscalService.deleteFiscal(id);
        res.status(204).send();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=fiscal.controller.js.map