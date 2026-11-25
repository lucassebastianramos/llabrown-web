import { NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/adminAuth';
import { getAuditLogsDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Acceso restringido a administradores.' }, { status: 403 });
  }
  const logs = await getAuditLogsDB(150);
  return NextResponse.json(logs);
}
