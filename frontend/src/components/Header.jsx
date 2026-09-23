import React from 'react';
import { Bell, Calendar } from 'lucide-react';

export default function Header({ title }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm h-16 flex items-center px-6 justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Calendar size={15} />
          <span>{dateStr}</span>
        </div>
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={18} className="text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">AC</span>
        </div>
      </div>
    </header>
  );
}
