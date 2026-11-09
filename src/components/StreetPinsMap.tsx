'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PinTerritorial } from '@/types';

const DynamicStreetPinsMap = dynamic(
  () => import('./StreetPinsMapInner'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-600 shadow-sm">
        <div className="w-8 h-8 border-2 border-[#371859] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-semibold">Cargando mapa interactivo de calles y barrios...</span>
      </div>
    ),
  }
);

interface Props {
  initialPins?: PinTerritorial[];
}

export default function StreetPinsMap({ initialPins }: Props) {
  return <DynamicStreetPinsMap initialPins={initialPins} />;
}
