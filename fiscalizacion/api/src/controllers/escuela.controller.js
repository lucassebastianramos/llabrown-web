import * as escuelaService from '../services/escuela.service.js';
export const getEscuelas = async (req, res) => {
    const { seccion, search } = req.query;
    try {
        const escuelas = await escuelaService.getAllEscuelas(seccion, search);
        // Remapear el resultado para que coincida con la estructura esperada
        const result = escuelas.map(e => ({
            id: e.id,
            nombre: e.nombre,
            domicilio: e.domicilio,
            circuito: e.circuito,
            seccion: e.seccion,
            fgId: e.fgId,
            incidencias_count: e.incidencias ? e.incidencias.length : (e._count?.incidencias ?? 0),
        }));
        res.json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const createEscuela = async (req, res) => {
    try {
        // Convertir seccion a number si viene como string
        const data = { ...req.body, seccion: Number(req.body.seccion) };
        const newEscuela = await escuelaService.createEscuela(data);
        res.status(201).json(newEscuela);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const updateEscuela = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id)
            return res.status(400).json({ error: 'Parámetro id requerido' });
        const data = { ...req.body, seccion: Number(req.body.seccion) };
        const updatedEscuela = await escuelaService.updateEscuela(id, data);
        res.json(updatedEscuela);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=escuela.controller.js.map