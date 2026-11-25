import prisma from '../lib/prisma.js';
import xlsx from 'xlsx';
import bcrypt from 'bcryptjs';

export class ValidationError extends Error {}

// Helpers
const onlyDigits = (s: string | null | undefined): string => (s ? String(s).replace(/\D/g, '') : '');
const parseSeccion = (seccionRaw: string | null | undefined, partidoRaw?: string | null) => {
  const digits = onlyDigits(seccionRaw);
  if (digits) return Number.parseInt(digits, 10);
  const partido = String(partidoRaw || '').toLowerCase();
  if (partido.includes('almirante brown')) return 3; // default para Brown
  return 0;
};

// Normaliza códigos de circuito: quita ceros a la izquierda antes de un sufijo opcional de letras, p.ej. "0021A" -> "21A"
const normalizeCircuito = (raw: string | null | undefined): string => {
  const s = String(raw || '').trim();
  if (!s) return '';
  // Separar parte numérica inicial y sufijo alfabético opcional
  const m = s.match(/^(\d+)([A-Za-z].*)?$/);
  if (!m) return s.toUpperCase();
  const num = (m[1] ?? '').replace(/^0+/, '') || '0';
  const suf = m[2] ?? '';
  return `${num}${suf.toUpperCase()}`;
};

// Limpia variaciones menores del nombre para matching (espacios múltiples, mayúsculas/minúsculas)
const normalizeNombreEscuela = (s: string): string => s.replace(/\s+/g, ' ').trim().toLowerCase();

// Define expected template for escuelas + fiscales generales
// Columns (normalized): DISTRITO, SECCION, ESTABLECIMIENTO, DOMICILIO, CIRCUITO ELECTORAL, CARGO, DNI, APELLIDO, NOMBRE, NRO CELULAR, REFERENTE A CARGO
const EXPECTED_SHEET_NAMES = ['ESCALAS', 'ESCALAS OCTUBRE', 'Sheet1'];
const REQUIRED_HEADERS = [
  'distrito',
  'seccion',
  'establecimiento',
  'domicilio',
  'circuito_electoral',
  'cargo',
  'dni',
  'apellido',
  'nombre',
  'nro_celular',
  'referente_a_cargo',
];

export const importDataFromXlsx = async (fileBuffer: Buffer, options?: { overwrite?: boolean }) => {
  const overwrite = !!options?.overwrite;
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new ValidationError('El archivo está vacío o no contiene hojas.');
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) throw new ValidationError('No se pudo leer la hoja principal.');

  // Allow any sheet name, but headers must match the expected template
  // Read rows with string defaults to avoid undefined, keeping numbers as strings if possible
  const data = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false, header: 1 }) as any[];
  if (!Array.isArray(data) || data.length === 0) throw new ValidationError('La hoja no contiene datos.');

  // Extract header row and rows
  const headerRow = (data[0] as any[]).map((h) => String(h ?? ''));
  const rows = data.slice(1).map((arr) => Object.fromEntries((arr as any[]).map((v, i) => [headerRow[i] ?? `col_${i}`, v])));

  const normalizeKey = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

  // Validate presence of required columns by normalized header
  const normalizedHeaders = new Set(headerRow.map((h) => normalizeKey(h)));
  const missing = REQUIRED_HEADERS.filter((k) => !normalizedHeaders.has(normalizeKey(k)));
  if (missing.length) {
    const expected = 'DISTRITO, SECCION, ESTABLECIMIENTO, DOMICILIO, CIRCUITO ELECTORAL, CARGO, DNI, APELLIDO, NOMBRE, NRO CELULAR, REFERENTE A CARGO';
    throw new ValidationError(`Faltan columnas obligatorias: ${missing.join(', ')}. Formato esperado: ${expected}`);
  }
  const getVal = (rowObj: any, candidates: string[]): string | null => {
    const map = new Map<string, any>();
    Object.entries(rowObj).forEach(([k, v]) => map.set(normalizeKey(String(k)), v));
    for (const cand of candidates) {
      const key = normalizeKey(cand);
      if (map.has(key)) {
        const val = map.get(key);
        if (val === null || val === undefined) return null;
        const str = String(val).trim();
        return str.length ? str : null;
      }
    }
    return null;
  };


  const getFullName = (rowObj: any): string | null => {
    // Try to find a single column that seems to contain a full fiscal name
    // e.g., 'fiscal', 'fiscal_general', 'fg', 'fiscal_nombre_apellido'
    for (const [k, v] of Object.entries(rowObj)) {
      const nk = normalizeKey(String(k));
      if ((nk.includes('fiscal') || nk === 'fg' || nk.includes('fiscal_general')) && typeof v === 'string') {
        const s = v.trim();
        if (s) return s;
      }
    }
    return null;
  };

  const splitName = (fullName: string): { nombre: string; apellido: string } => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return { nombre: 'N/A', apellido: 'N/A' };
    if (parts.length === 1) {
      const only = parts[0] ?? '';
      return { nombre: only, apellido: 'N/A' };
    }
    const apellido = String(parts[parts.length - 1] ?? '');
    const nombre = parts.slice(0, -1).join(' ');
    return { nombre, apellido };
  };

  const uniqueEmailFor = async (tx: any, base: string) => {
    let email = `${base}@example.com`;
    let i = 1;
    while (await tx.user.findFirst({ where: { email } })) {
      email = `${base}${i}@example.com`;
      i += 1;
    }
    return email;
  };

  let rowsProcessed = 0;
  let escuelasCreated = 0;
  let escuelasMatched = 0;
  let usersCreated = 0;
  let usersUpdated = 0;
  let asignacionesUpserted = 0;
  let fgAssigned = 0;
  let encargadosUpserted = 0;
  let fgOverwritten = 0;
  let scrapsCreated = 0;

  // Process rows sequentially in per-row transactions to avoid interactive transaction timeout
  for (const row of rows) {
    await prisma.$transaction(async (tx) => {
      // Read values with strict mapping to the expected template (avoid using 'nombre' for school)
      const nombreEscuelaRaw = getVal(row, [
        'establecimiento',
        'nombre_escuela',
        'escuela',
      ]);
  const nombreEscuela = nombreEscuelaRaw ? nombreEscuelaRaw.trim() : null;
      const domicilio = (getVal(row, ['domicilio']) ?? '').trim();
  const circuito = normalizeCircuito(getVal(row, ['circuito_electoral', 'circuito']));
  const seccionStr = getVal(row, ['seccion']) ?? '';
  const partidoODistrito = getVal(row, ['partido']) ?? getVal(row, ['distrito']) ?? '';
  const seccionNum = parseSeccion(seccionStr, partidoODistrito);

      if (!nombreEscuela) {
        return; // Skip row without a school name
      }

  const seccion = Number.isFinite(seccionNum) ? seccionNum : 0;

      // Find or create the school
      let escuela = await tx.escuela.findFirst({
        where: {
          // Intento 1: match fuerte por nombre + circuito normalizado si existe
          AND: [
            { nombre: { equals: nombreEscuela, mode: 'insensitive' } },
            circuito ? { circuito: normalizeCircuito(circuito) } : {},
          ] as any,
        },
      });
      if (!escuela) {
        // Intento 2: buscar por nombre normalizado usando contains (para diferencias mínimas)
        const candidates = await tx.escuela.findMany({ where: { nombre: { contains: nombreEscuela.split(' ')[0], mode: 'insensitive' } } });
        const targetKey = normalizeNombreEscuela(nombreEscuela);
        const matched = candidates.find((c: any) => normalizeNombreEscuela(c.nombre) === targetKey);
        if (matched) {
          escuela = matched;
          escuelasMatched += 1;
          // Si no tenía circuito o sección útil, actualizar con datos nuevos sin romper FG/mesas
          await tx.escuela.update({ where: { id: escuela.id }, data: {
            domicilio: domicilio || escuela.domicilio,
            circuito: circuito || escuela.circuito,
            seccion: seccion || escuela.seccion,
          }});
        } else {
          escuela = await tx.escuela.create({
            data: { nombre: nombreEscuela, domicilio, circuito, seccion },
          });
          escuelasCreated += 1;
        }
      } else {
        escuelasMatched += 1;
      }

      // FG data per template (accept common plural/alias headers)
      let nombreFiscal = getVal(row, ['nombre', 'nombres']);
      let apellidoFiscal = getVal(row, ['apellido', 'apellidos']);
      const dniFiscal = getVal(row, ['dni', 'documento', 'd.n.i']);
      const celularFiscal = getVal(row, [
        'nro_celular',
        'nro celular',
        'celular',
        'telefono',
        'teléfono',
        'nro_telefono',
      ]);

      // Role mapping from possible headers or any cell content
      const cargoRaw = getVal(row, [
        'cargo',
        'referente a cargo',
        'referente',
        'a cargo',
        'rol',
        'funcion',
        'función',
        'puesto',
        'tipo',
        'tipo de fiscal',
        'tipo_fiscal',
        'perfil'
      ]);

      let role: 'coordinador' | 'encargado_seccion' | 'fiscal_general' | 'fiscal_mesa' = 'fiscal_general';

      const decideRole = (s: string) => {
        const nc = normalizeKey(s);
        if (/(coordinador|coord)/.test(nc)) return 'coordinador' as const;
        if (/(referente|a_cargo|encargado.*seccion|encargado.*circuito)/.test(nc)) return 'encargado_seccion' as const;
        if (/(mesa)/.test(nc)) return 'fiscal_mesa' as const;
        if (/(general|^fg$|fiscal_general)/.test(nc)) return 'fiscal_general' as const;
        return null;
      };

      if (cargoRaw) {
        role = decideRole(cargoRaw) ?? role;
      } else {
        // Fallback: scan all cell values for hints
        for (const v of Object.values(row)) {
          if (typeof v === 'string') {
            const r = decideRole(v);
            if (r) { role = r; break; }
          }
        }
      }

      if ((!nombreFiscal || !apellidoFiscal)) {
        const fullName = getFullName(row);
        if (fullName) {
          const split = splitName(fullName);
          nombreFiscal = nombreFiscal ?? split.nombre;
          apellidoFiscal = apellidoFiscal ?? split.apellido;
        }
      }

      if (nombreFiscal && apellidoFiscal) {
        const base = `${normalizeKey(nombreFiscal)}.${normalizeKey(apellidoFiscal)}`;
        const email = await uniqueEmailFor(tx, base);
        const hashed = await bcrypt.hash('defaultpassword', 10);

        // Try to find existing fiscal to avoid duplicates
        let fiscal = null as null | { id: string };
        if (dniFiscal) {
          fiscal = await tx.user.findFirst({ where: { dni: dniFiscal } });
        }
        if (!fiscal) {
          fiscal = await tx.user.findFirst({ where: { nombre: nombreFiscal, apellido: apellidoFiscal } , select: { id: true } });
        }
        if (!fiscal) {
          fiscal = await tx.user.findFirst({ where: { email } , select: { id: true } });
        }

        if (fiscal) {
          const updateData: any = { role };
          if (dniFiscal !== null) updateData.dni = dniFiscal;
          if (celularFiscal !== null) updateData.celular = celularFiscal;
          await tx.user.update({ where: { id: fiscal.id }, data: updateData });
          usersUpdated += 1;
        } else {
          const created = await tx.user.create({
            data: {
              nombre: nombreFiscal,
              apellido: apellidoFiscal,
              dni: dniFiscal ?? null,
              celular: celularFiscal ?? null,
              role,
              email,
              password: hashed,
            },
            select: { id: true },
          });
          fiscal = created;
          usersCreated += 1;
        }

        // Link assignment for this role to this escuela
        if (role !== 'encargado_seccion') {
          await (tx as any).asignacion.deleteMany({ where: { userId: fiscal.id, role, NOT: { escuelaId: escuela.id } } });
        }
        await (tx as any).asignacion.upsert({
          where: { userId_escuelaId_role: { userId: fiscal.id, escuelaId: escuela.id, role } },
          update: {},
          create: { userId: fiscal.id, escuelaId: escuela.id, role },
        });
        asignacionesUpserted += 1;

        if (role === 'fiscal_general') {
          // If overwrite mode and school had a different FG, move previous FG to ScrapFg
          const prev = await tx.escuela.findUnique({ where: { id: escuela.id }, select: { fgId: true } });
          if (overwrite && prev?.fgId && prev.fgId !== fiscal.id) {
            await (tx as any).scrapFg.create({ data: { escuelaId: escuela.id, userId: prev.fgId, reason: 'overwrite_import' } });
            scrapsCreated += 1;
            fgOverwritten += 1;
          }
          await tx.escuela.update({ where: { id: escuela.id }, data: { fgId: fiscal.id } });
          await (tx as any).escuela.updateMany({ where: { fgId: fiscal.id, NOT: { id: escuela.id } }, data: { fgId: null } });
          fgAssigned += 1;
        }
      }

      // NEW: crear Encargado de circuito desde la columna REFERENTE A CARGO (si trae un nombre)
      const referenteNombreRaw = getVal(row, ['referente a cargo', 'referente_a_cargo']);
      if (referenteNombreRaw) {
        const refName = String(referenteNombreRaw).trim();
        if (refName.length) {
          const { nombre: refNombre, apellido: refApellido } = splitName(refName);

          // Buscar existente global por nombre+apellido o DNI si estuviera en otras columnas
          const refDni = getVal(row, ['dni_referente', 'referente_dni', 'dni']);
          let encargado = null as any;
          if (refDni) encargado = await tx.user.findFirst({ where: { dni: refDni } , select: { id: true } });
          if (!encargado) encargado = await tx.user.findFirst({ where: { nombre: refNombre, apellido: refApellido }, select: { id: true } });

          if (!encargado) {
            const baseEnc = `${normalizeKey(refNombre)}.${normalizeKey(refApellido)}.enc`;
            const emailEnc = await uniqueEmailFor(tx, baseEnc);
            const hashedEnc = await bcrypt.hash('defaultpassword', 10);
            encargado = await tx.user.create({
              data: {
                nombre: refNombre,
                apellido: refApellido,
                role: 'encargado_seccion',
                email: emailEnc,
                password: hashedEnc,
              },
              select: { id: true },
            });
            usersCreated += 1;
          } else {
            usersUpdated += 1;
          }

          // Asignación a la escuela (no crear duplicados)
          await (tx as any).asignacion.upsert({
            where: { userId_escuelaId_role: { userId: encargado.id, escuelaId: escuela.id, role: 'encargado_seccion' } },
            update: {},
            create: { userId: encargado.id, escuelaId: escuela.id, role: 'encargado_seccion' },
          });
          encargadosUpserted += 1;
        }
      }

      rowsProcessed += 1;
    }, { timeout: 60000, maxWait: 15000 });
  }
  return { rowsProcessed, escuelasCreated, escuelasMatched, usersCreated, usersUpdated, asignaciones: asignacionesUpserted, fgAssigned, encargadosAsignados: encargadosUpserted, fgOverwritten, scrapsCreated };
};

// Importación específica de Mesas: DISTRITO, ESTABLECIMIENTO, DOMICILIO, CIRCUITO ELECTORAL, MESA NRO, DNI, NRO CELULAR, NOMBRES, APELLIDOS, REFERENTE A CARGO
export const importMesasFromXlsx = async (fileBuffer: Buffer, options?: { createUsers?: boolean }) => {
  const createUsers = !!options?.createUsers;
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new ValidationError('El archivo está vacío o no contiene hojas.');
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new ValidationError('No se pudo leer la hoja principal.');

  const data = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false, header: 1 }) as any[];
  if (!Array.isArray(data) || data.length === 0) throw new ValidationError('La hoja no contiene datos.');
  const headerRow = (data[0] as any[]).map((h) => String(h ?? ''));
  const rows = data.slice(1).map((arr) => Object.fromEntries((arr as any[]).map((v, i) => [headerRow[i] ?? `col_${i}`, v])));

  const normalizeKey = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const required = [
    'distrito',
    'establecimiento',
    'domicilio',
    'circuito_electoral',
    'mesa_nro',
    'dni',
    'nro_celular',
    'nombres',
    'apellidos',
    'referente_a_cargo',
  ];
  const normalizedHeaders = new Set(headerRow.map((h) => normalizeKey(h)));
  const missing = required.filter((k) => !normalizedHeaders.has(normalizeKey(k)));
  if (missing.length) throw new ValidationError(`Faltan columnas obligatorias: ${missing.join(', ')}`);

  const getVal = (rowObj: any, candidates: string[]): string | null => {
    const map = new Map<string, any>();
    Object.entries(rowObj).forEach(([k, v]) => map.set(normalizeKey(String(k)), v));
    for (const cand of candidates) {
      const key = normalizeKey(cand);
      if (map.has(key)) {
        const val = map.get(key);
        if (val === null || val === undefined) return null;
        const str = String(val).trim();
        return str.length ? str : null;
      }
    }
    return null;
  };

  const uniqueEmailFor = async (tx: any, base: string) => {
    let email = `${base}@example.com`;
    let i = 1;
    while (await tx.user.findFirst({ where: { email } })) {
      email = `${base}${i}@example.com`;
      i += 1;
    }
    return email;
  };

  let rowsProcessed = 0;
  let mesasCreated = 0;
  let mesasUpdated = 0;
  let asignaciones = 0;
  // New diagnostic counters
  let matchedByDni = 0;
  let matchedByNombreApellido = 0;
  let matchedByCelular = 0;
  let matchedByNombreApellidoSwapped = 0;
  let usersCreated = 0;
  let usersSkippedWithoutIdentity = 0;

  for (const row of rows) {
    await prisma.$transaction(async (tx) => {
      const distrito = getVal(row, ['distrito']);
      // Distrito no se usa para matching, pero podría validarse opcionalmente
      const establecimiento = getVal(row, ['establecimiento']);
      const domicilio = getVal(row, ['domicilio']);
      const circuito = getVal(row, ['circuito_electoral']);
  const mesaNro = (getVal(row, ['mesa_nro', 'mesa']) ?? '').trim();
      const dniRaw = getVal(row, ['dni']);
      const celularRaw = getVal(row, ['nro_celular', 'celular']);
      const nombresRaw = getVal(row, ['nombres']);
      const apellidosRaw = getVal(row, ['apellidos']);
      const referente = getVal(row, ['referente_a_cargo']);
  const seccionStr = getVal(row, ['seccion']);
  const seccionParsed = parseSeccion(seccionStr, distrito);

      const dni = dniRaw ? String(dniRaw).trim() : null;
      const celular = celularRaw ? String(celularRaw).trim() : null;
      const nombres = nombresRaw ? String(nombresRaw).trim() : null;
      const apellidos = apellidosRaw ? String(apellidosRaw).trim() : null;

      rowsProcessed += 1;
      if (!establecimiento || !mesaNro) {
        // Sin datos clave para crear la mesa, saltar fila
        return;
      }

      // Buscar escuela por nombre (case-insensitive), o por combinación domicilio+circuito si nombre no encaja
      let escuela = await tx.escuela.findFirst({
        where: { nombre: { equals: establecimiento, mode: 'insensitive' } },
      });
      if (!escuela && (domicilio || circuito)) {
        const where: any = { AND: [] as any[] };
        if (domicilio) where.AND.push({ domicilio: { contains: domicilio, mode: 'insensitive' } });
        if (circuito) where.AND.push({ circuito: { contains: circuito, mode: 'insensitive' } });
        escuela = await tx.escuela.findFirst({ where });
      }
      if (!escuela) {
        // Si no existe, la creamos mínimamente, para no frenar la carga (opcional: podríamos acumular para reporte)
        escuela = await tx.escuela.create({
          data: {
            nombre: establecimiento,
            domicilio: domicilio ?? '',
            circuito: circuito ?? '',
            seccion: seccionParsed,
          },
        });
      }

      // Crear/actualizar Mesa fija
      const existingMesa = await (tx as any).mesa.findUnique({ where: { escuelaId_nro: { escuelaId: escuela.id, nro: mesaNro! } } });
      const mesa = await (tx as any).mesa.upsert({
        where: { escuelaId_nro: { escuelaId: escuela.id, nro: mesaNro! } },
        update: {},
        create: { escuelaId: escuela.id, nro: mesaNro! },
      });
      if (existingMesa) mesasUpdated += 1; else mesasCreated += 1;

      // Si hay un fiscal existente, asignarlo a la mesa; si no, crear si createUsers= true
      let user: { id: string } | null = null;

      // 1) Match por DNI (aceptando formatos con puntos o espacios)
      if (dni) {
        const dniDigits = String(dni).replace(/\D/g, '');
        const or: any[] = [{ dni }];
        if (dniDigits && dniDigits !== dni) or.push({ dni: dniDigits });
        user = await (tx as any).user.findFirst({ where: { OR: or }, select: { id: true } });
        if (user) matchedByDni += 1;
      }

      // 2) Match por Nombre + Apellido (case-insensitive), sin requerir escuela previa
      if (!user && nombres && apellidos) {
        user = await (tx as any).user.findFirst({
          where: {
            nombre: { equals: nombres, mode: 'insensitive' },
            apellido: { equals: apellidos, mode: 'insensitive' },
          },
          select: { id: true },
        });
        if (user) matchedByNombreApellido += 1;
      }

      // 2b) Fallback: si vienen invertidos (NOMBRES=apellido, APELLIDOS=nombre)
      if (!user && nombres && apellidos) {
        user = await (tx as any).user.findFirst({
          where: {
            nombre: { equals: apellidos, mode: 'insensitive' },
            apellido: { equals: nombres, mode: 'insensitive' },
          },
          select: { id: true },
        });
        if (user) matchedByNombreApellidoSwapped += 1;
      }

      // 3) Match por Celular exacto o sólo dígitos
      if (!user && celular) {
        const celNorm = String(celular).replace(/\s+/g, '');
        const celDigits = celNorm.replace(/\D/g, '');
        const orCel: any[] = [{ celular: celNorm }];
        if (celDigits && celDigits !== celNorm) orCel.push({ celular: celDigits });
        user = await (tx as any).user.findFirst({ where: { OR: orCel }, select: { id: true } });
        if (user) matchedByCelular += 1;
      }

      // 4) Crear usuario si se pidió y hay datos mínimos
      if (!user && createUsers) {
        const hasDni = !!dni;
        const hasFullName = !!(nombres && apellidos);
        if (!(hasDni || hasFullName)) {
          usersSkippedWithoutIdentity += 1;
        } else {
          // Build sensible defaults
          const nombreC = (nombres ?? '').trim() || 'Sin Nombre';
          const apellidoC = (apellidos ?? '').trim() || 'Sin Apellido';
          // Prefer base from DNI to avoid n.a.n.a@ when names missing
          const baseRaw = hasDni
            ? String(dni).replace(/\D/g, '')
            : `${(nombreC || 'fiscal')}.${(apellidoC || 'mesa')}`;
          const base = baseRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'fiscal.mesa';
          const email = await uniqueEmailFor(tx, base);
          const hashed = await bcrypt.hash('defaultpassword', 10);
          const created = await (tx as any).user.create({
            data: {
              nombre: nombreC,
              apellido: apellidoC,
              dni: dni ? String(dni).replace(/\D/g, '') : null,
              celular: celular ? String(celular).replace(/\s+/g, '') : null,
              role: 'fiscal_mesa',
              email,
              password: hashed,
              escuelaId: escuela.id,
              mesaNro: mesaNro,
            },
            select: { id: true },
          });
          user = created;
          usersCreated += 1;
        }
      }

      if (user) {
        await (tx as any).mesa.update({ where: { id: mesa.id }, data: { fiscalId: user.id } });
        asignaciones += 1;
        // opcional: sincronizar dato auxiliar en el usuario
        const upd: any = { role: 'fiscal_mesa', escuelaId: escuela.id };
        if (mesaNro != null) upd.mesaNro = mesaNro;
        if (celular != null) upd.celular = String(celular).replace(/\s+/g, '');
        await (tx as any).user.update({ where: { id: user.id }, data: upd });
        // Enforce single-school assignment for fiscal_mesa
        await (tx as any).asignacion.deleteMany({ where: { userId: user.id, role: 'fiscal_mesa', NOT: { escuelaId: escuela.id } } });
        await (tx as any).asignacion.upsert({
          where: { userId_escuelaId_role: { userId: user.id, escuelaId: escuela.id, role: 'fiscal_mesa' } },
          update: {},
          create: { userId: user.id, escuelaId: escuela.id, role: 'fiscal_mesa' },
        });
      }
    }, { timeout: 60000, maxWait: 15000 });
  }
  return { rowsProcessed, mesasCreated, mesasUpdated, asignaciones, matchedByDni, matchedByNombreApellido, matchedByNombreApellidoSwapped, matchedByCelular, usersCreated, usersSkippedWithoutIdentity };
};

// ---------------------- Generic Imports (CSV/XLSX) ----------------------

type GenericRow = Record<string, any>;

const normalizeKeyGlobal = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const parseBufferToRows = (fileBuffer: Buffer, filename?: string): { header: string[]; rows: GenericRow[] } => {
  const lower = (filename || '').toLowerCase();
  if (lower.endsWith('.csv')) {
    const text = fileBuffer.toString('utf8');
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (!lines.length) throw new ValidationError('El CSV está vacío.');
    const first = lines[0] || '';
    const header = first.split(',').map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(',');
      const obj: GenericRow = {};
      header.forEach((h, i) => (obj[h] = (cols[i] ?? '').trim()));
      return obj;
    });
    return { header, rows };
  }
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new ValidationError('El archivo está vacío o no contiene hojas.');
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new ValidationError('No se pudo leer la hoja principal.');
  const data = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false, header: 1 }) as any[];
  if (!Array.isArray(data) || data.length === 0) throw new ValidationError('La hoja no contiene datos.');
  const header = (data[0] as any[]).map((h) => String(h ?? ''));
  const rows = data.slice(1).map((arr) => Object.fromEntries((arr as any[]).map((v, i) => [header[i] ?? `col_${i}`, v])));
  return { header, rows };
};

const getValFromRow = (rowObj: any, candidates: string[]): string | null => {
  const map = new Map<string, any>();
  Object.entries(rowObj).forEach(([k, v]) => map.set(normalizeKeyGlobal(String(k)), v));
  for (const cand of candidates) {
    const key = normalizeKeyGlobal(cand);
    if (map.has(key)) {
      const val = map.get(key);
      if (val === null || val === undefined) return null;
      const str = String(val).trim();
      return str.length ? str : null;
    }
  }
  return null;
};

export const importGenericosFiscalesMesa = async (fileBuffer: Buffer, filename?: string) => {
  const { header, rows } = parseBufferToRows(fileBuffer, filename);
  const normalizedHeaders = new Set(header.map((h) => normalizeKeyGlobal(h)));

  const requiredFull = ['apellido', 'nombre', 'referente', 'validado', 'establecimiento', 'circuito', 'partido', 'seccion'];
  const requiredCsv = ['seccion', 'partido', 'circuito', 'nombre', 'apellido', 'referente', 'validado'];
  const hasFull = requiredFull.every((k) => normalizedHeaders.has(normalizeKeyGlobal(k)));
  const hasCsv = requiredCsv.every((k) => normalizedHeaders.has(normalizeKeyGlobal(k)));
  if (!hasFull && !hasCsv) {
    const missingFull = requiredFull.filter((k) => !normalizedHeaders.has(normalizeKeyGlobal(k)));
    const missingCsv = requiredCsv.filter((k) => !normalizedHeaders.has(normalizeKeyGlobal(k)));
    throw new ValidationError(`Faltan columnas. Formato 1 faltantes: ${missingFull.join(', ')} | Formato 2 faltantes: ${missingCsv.join(', ')}`);
  }

  let created = 0;
  let updated = 0;
  let linkedEscuela = 0;

  for (const row of rows) {
    await prisma.$transaction(async (tx) => {
      const apellido = getValFromRow(row, ['apellido']);
      const nombre = getValFromRow(row, ['nombre']);
      const establecimiento = getValFromRow(row, ['establecimiento']);
      const circuito = getValFromRow(row, ['circuito']);
      const seccionStr = getValFromRow(row, ['seccion']);
      const partido = getValFromRow(row, ['partido', 'distrito']);
      const seccion = (() => {
        const d = (s: string | null) => (s ? String(s).replace(/\D/g, '') : '');
        const digits = d(seccionStr);
        if (digits) return Number.parseInt(digits, 10);
        const p = String(partido || '').toLowerCase();
        if (p.includes('almirante brown')) return 3;
        return 0;
      })();

      if (!apellido || !nombre) return;

      let user = await tx.user.findFirst({ where: { nombre: { equals: nombre, mode: 'insensitive' }, apellido: { equals: apellido, mode: 'insensitive' } } });
      if (!user) {
        const base = `${normalizeKeyGlobal(nombre)}.${normalizeKeyGlobal(apellido)}`;
        let email = `${base}@example.com`;
        let i = 1;
        while (await tx.user.findFirst({ where: { email } })) { email = `${base}${i}@example.com`; i += 1; }
        const hashed = await bcrypt.hash('defaultpassword', 10);
        user = await tx.user.create({ data: { nombre, apellido, email, password: hashed, role: 'fiscal_mesa' } });
        created += 1;
      } else {
        await tx.user.update({ where: { id: user.id }, data: { role: 'fiscal_mesa' } });
        updated += 1;
      }

      if (establecimiento) {
        let escuela = await tx.escuela.findFirst({ where: { nombre: { equals: establecimiento, mode: 'insensitive' } } });
        if (!escuela && (circuito || Number.isFinite(seccion))) {
          const where: any = { AND: [] as any[] };
          if (circuito) where.AND.push({ circuito: { contains: circuito, mode: 'insensitive' } });
          if (Number.isFinite(seccion)) where.AND.push({ seccion });
          escuela = await tx.escuela.findFirst({ where });
        }
        if (escuela) {
          await tx.user.update({ where: { id: (user as any).id }, data: { escuelaId: escuela.id } });
          linkedEscuela += 1;
        }
      }
    }, { timeout: 60000, maxWait: 15000 });
  }

  return { created, updated, linkedEscuela };
};

export const importGenericosFiscalesGenerales = async (fileBuffer: Buffer, filename?: string) => {
  const { header, rows } = parseBufferToRows(fileBuffer, filename);
  const normalizedHeaders = new Set(header.map((h) => normalizeKeyGlobal(h)));
  const requiredFull = ['apellido', 'nombre', 'referente', 'validado', 'establecimiento', 'circuito', 'partido', 'seccion'];
  const requiredCsv = ['seccion', 'partido', 'circuito', 'nombre', 'apellido', 'referente', 'validado'];
  const hasFull = requiredFull.every((k) => normalizedHeaders.has(normalizeKeyGlobal(k)));
  const hasCsv = requiredCsv.every((k) => normalizedHeaders.has(normalizeKeyGlobal(k)));
  if (!hasFull && !hasCsv) {
    const missingFull = requiredFull.filter((k) => !normalizedHeaders.has(normalizeKeyGlobal(k)));
    const missingCsv = requiredCsv.filter((k) => !normalizedHeaders.has(normalizeKeyGlobal(k)));
    throw new ValidationError(`Faltan columnas. Formato 1 faltantes: ${missingFull.join(', ')} | Formato 2 faltantes: ${missingCsv.join(', ')}`);
  }

  let created = 0;
  let updated = 0;
  let asignadosFG = 0;

  for (const row of rows) {
    await prisma.$transaction(async (tx) => {
      const apellido = getValFromRow(row, ['apellido']);
      const nombre = getValFromRow(row, ['nombre']);
      const establecimiento = getValFromRow(row, ['establecimiento']);
      const circuito = getValFromRow(row, ['circuito']);
      const seccionStr = getValFromRow(row, ['seccion']);
      const partido = getValFromRow(row, ['partido', 'distrito']);
      const seccion = (() => {
        const d = (s: string | null) => (s ? String(s).replace(/\D/g, '') : '');
        const digits = d(seccionStr);
        if (digits) return Number.parseInt(digits, 10);
        const p = String(partido || '').toLowerCase();
        if (p.includes('almirante brown')) return 3;
        return 0;
      })();

      if (!apellido || !nombre) return;

      let user = await tx.user.findFirst({ where: { nombre: { equals: nombre, mode: 'insensitive' }, apellido: { equals: apellido, mode: 'insensitive' } } });
      if (!user) {
        const base = `${normalizeKeyGlobal(nombre)}.${normalizeKeyGlobal(apellido)}`;
        let email = `${base}@example.com`;
        let i = 1;
        while (await tx.user.findFirst({ where: { email } })) { email = `${base}${i}@example.com`; i += 1; }
        const hashed = await bcrypt.hash('defaultpassword', 10);
        user = await tx.user.create({ data: { nombre, apellido, email, password: hashed, role: 'fiscal_general' } });
        created += 1;
      } else {
        await tx.user.update({ where: { id: user.id }, data: { role: 'fiscal_general' } });
        updated += 1;
      }

      if (establecimiento) {
        let escuela = await tx.escuela.findFirst({ where: { nombre: { equals: establecimiento, mode: 'insensitive' } } });
        if (!escuela && (circuito || Number.isFinite(seccion))) {
          const where: any = { AND: [] as any[] };
          if (circuito) where.AND.push({ circuito: { contains: circuito, mode: 'insensitive' } });
          if (Number.isFinite(seccion)) where.AND.push({ seccion });
          escuela = await tx.escuela.findFirst({ where });
        }
        if (escuela && !escuela.fgId) {
          await tx.escuela.update({ where: { id: escuela.id }, data: { fgId: (user as any).id } });
          asignadosFG += 1;
        }
      }
    }, { timeout: 60000, maxWait: 15000 });
  }

  return { created, updated, asignadosFG };
};

export const importGenericosEstablecimientos = async (fileBuffer: Buffer, filename?: string) => {
  const { header, rows } = parseBufferToRows(fileBuffer, filename);
  const normalizedHeaders = new Set(header.map((h) => normalizeKeyGlobal(h)));
  const required = ['establecimiento'];
  const missing = required.filter((k) => !normalizedHeaders.has(normalizeKeyGlobal(k)));
  if (missing.length) throw new ValidationError(`Faltan columnas obligatorias: ${missing.join(', ')}`);

  let escuelasCreated = 0;
  let escuelasUpdated = 0;
  let mesasCreated = 0;
  let mesasUpdated = 0;

  const parseMesas = (val: string | null): string[] => {
    if (!val) return [];
    const raw = String(val).trim();
    try {
      const arr = JSON.parse(raw.replace(/'/g, '"'));
      if (Array.isArray(arr)) return arr.map((x) => String(x));
    } catch {}
    // fallback: extract numbers between quotes or digits separated by non-digits
    const byQuote = raw.match(/\d+/g);
    return byQuote ? byQuote.map((n) => String(n)) : [];
  };

  for (const row of rows) {
    await prisma.$transaction(async (tx) => {
      const establecimiento = getValFromRow(row, ['establecimiento']);
      if (!establecimiento) return;
      const direccion = getValFromRow(row, ['direccion', 'domicilio']);
      const circuito = getValFromRow(row, ['circuito', 'circuito_loc']);
      const seccionStr = getValFromRow(row, ['seccion']);
      const partido = getValFromRow(row, ['partido', 'distrito']);
      const seccion = (() => {
        const d = (s: string | null) => (s ? String(s).replace(/\D/g, '') : '');
        const digits = d(seccionStr);
        if (digits) return Number.parseInt(digits, 10);
        const p = String(partido || '').toLowerCase();
        if (p.includes('almirante brown')) return 3;
        return 0;
      })();
      const mesasNumStr = getValFromRow(row, ['mesas_numero', 'mesas']);
      const listaMesas = parseMesas(mesasNumStr);

      let escuela = await tx.escuela.findFirst({ where: { nombre: { equals: establecimiento, mode: 'insensitive' } } });
      if (!escuela) {
        escuela = await tx.escuela.create({ data: { nombre: establecimiento, domicilio: direccion ?? '', circuito: circuito ?? '', seccion } });
        escuelasCreated += 1;
      } else {
        await tx.escuela.update({ where: { id: escuela.id }, data: { domicilio: direccion ?? escuela.domicilio, circuito: circuito ?? escuela.circuito, seccion: seccion || escuela.seccion } });
        escuelasUpdated += 1;
      }

      for (const nro of listaMesas) {
        const existing = await tx.mesa.findUnique({ where: { escuelaId_nro: { escuelaId: escuela.id, nro } } });
        await tx.mesa.upsert({ where: { escuelaId_nro: { escuelaId: escuela.id, nro } }, update: {}, create: { escuelaId: escuela.id, nro } });
        if (existing) mesasUpdated += 1; else mesasCreated += 1;
      }
    }, { timeout: 60000, maxWait: 15000 });
  }

  return { escuelasCreated, escuelasUpdated, mesasCreated, mesasUpdated };
};