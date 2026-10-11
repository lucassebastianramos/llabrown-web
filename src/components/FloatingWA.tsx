'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function FloatingWA() {
  return (
    <a
      href="https://wa.me/5491167218190?text=Hola%20quiero%20sumarme%20desde%20la%20web"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hablar por WhatsApp con La Libertad Avanza Brown"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-lg shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all duration-300 group"
    >
      <MessageCircle className="w-7 h-7 text-white fill-white" />
      <span className="absolute right-16 bg-[#160c28] border border-purple-800/60 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap">
        Escribinos por WhatsApp
      </span>
    </a>
  );
}
