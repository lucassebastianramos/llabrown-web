import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Clean filename
    const cleanOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(cleanOriginalName);
    const base = path.basename(cleanOriginalName, ext);
    const uniqueName = `${base}-${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${uniqueName}`;

    return NextResponse.json({
      url,
      originalName: file.name,
      fileName: uniqueName,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
