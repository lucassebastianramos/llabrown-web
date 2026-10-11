import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbStatus = 'disconnected';
  try {
    const res = await pool.query('SELECT 1');
    if (res.rowCount && res.rowCount > 0) {
      dbStatus = 'connected';
    }
  } catch (e) {
    dbStatus = 'unreachable';
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'llabrown-web',
    database: dbStatus,
  });
}
