import * as incidenciaService from '../services/incidencia.service.js';
export const getIncidencias = async (req, res) => {
    try {
        const incidencias = await incidenciaService.getAllIncidencias();
        res.json(incidencias);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const createIncidencia = async (req, res) => {
    try {
        const newIncidencia = await incidenciaService.createIncidencia(req.body);
        res.status(201).json(newIncidencia);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const updateIncidencia = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id)
            return res.status(400).json({ error: 'Parámetro id requerido' });
        const updatedIncidencia = await incidenciaService.updateIncidencia(id, req.body);
        res.json(updatedIncidencia);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const deleteIncidencia = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id)
            return res.status(400).json({ error: 'Parámetro id requerido' });
        await incidenciaService.deleteIncidencia(id);
        res.status(204).send();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=incidencia.controller.js.map