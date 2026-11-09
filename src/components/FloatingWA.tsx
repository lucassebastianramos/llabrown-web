'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function FloatingWA() {
  return (
    <a
      href="https://wa.me/5491131596936?text=Hola%20quiero%20comunicarme%20con%20La%20Libertad%20Avanza%20Almirante%20Brown"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hablar por WhatsApp con La Libertad Avanza Brown"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#371859] hover:bg-[#230552] text-white rounded-full shadow-xl border-2 border-white hover:scale-105 active:scale-95 transition-all duration-200 group"
    >
      <MessageCircle className="w-6 h-6 text-white fill-white" />
      <span className="absolute right-16 bg-[#371859] border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap">
        WhatsApp Oficial: 11 3159-6936
      </span>
    </a>
  );
}
