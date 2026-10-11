'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const DynamicAdminPinPicker = dynamic(
  () => import('./AdminPinPickerInner'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 rounded-3xl glass-panel border border-purple-500/30 flex flex-col items-center justify-center text-slate-300">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-semibold">Cargando mapa interactivo para concejales...</span>
      </div>
    ),
  }
);

export default function AdminPinPicker() {
  return <DynamicAdminPinPicker />;
}
