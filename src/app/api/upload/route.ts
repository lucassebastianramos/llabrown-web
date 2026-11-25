import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { isAuthenticatedUser } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);

function hasValidMagicBytes(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 12) return false;
  if (ext === '.pdf') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46 && buffer[4] === 0x2d;
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (ext === '.png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (ext === '.webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

export async function POST(req: Request) {
  try {
    if (!isAuthenticatedUser(req)) {
      return NextResponse.json({ error: 'Iniciá sesión para subir archivos.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'El archivo supera el tamaño máximo permitido (15 MB).' },
        { status: 413 }
      );
    }

    const cleanOriginalName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(cleanOriginalName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: 'Formato no permitido. Solo se aceptan archivos PDF, JPG, PNG o WebP.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!hasValidMagicBytes(buffer, ext)) {
      return NextResponse.json(
        { error: 'El contenido del archivo no coincide con su formato declarado.' },
        { status: 400 }
      );
    }

    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const base = path.basename(cleanOriginalName, path.extname(cleanOriginalName)).slice(0, 60) || 'archivo';
    const suffix = crypto.randomUUID().slice(0, 8);
    const uniqueName = `${base}-${Date.now()}-${suffix}${ext}`;
    const filePath = path.resolve(uploadsDir, uniqueName);

    if (!filePath.startsWith(uploadsDir + path.sep)) {
      return NextResponse.json({ error: 'Nombre de archivo inválido' }, { status: 400 });
    }

    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/uploads/${uniqueName}`,
      originalName: cleanOriginalName,
      fileName: uniqueName,
      size: file.size,
      type: file.type,
    });
  } catch {
    return NextResponse.json({ error: 'Error al procesar la carga del archivo.' }, { status: 500 });
  }
}
