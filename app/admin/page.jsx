import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react'; // Usando Lucide como set de iconos

export default function AdminPanel() {
  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900">
      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* CABECERA */}
        <header className="bg-white shadow-sm p-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            Bienvenido al Panel Administrador de Farmimport
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 italic">31 de Enero, 2026</span>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              AD
            </div>
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <div className="p-8">
          
          {/* SECCIÓN DE BIENVENIDA */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
            <h2 className="text-3xl font-bold mb-2">¡Hola Administrador!</h2>
            <p className="text-blue-100 max-w-md">
              Desde aquí puedes gestionar el inventario de medicamentos, supervisar pedidos y controlar el flujo de Farmimport de manera eficiente.
            </p>
            <button className="mt-6 bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition">
              Ver Reportes
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}