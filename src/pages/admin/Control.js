// /src/pages/admin/Control.js
import AdminGate from '@/components/AdminGate';
import React from 'react';

const Control = () => {
  return (
    <AdminGate>
    <div className='control-container'>
      <h1>Control de Solicitudes</h1>
      <p>Bienvenido a Control, aquí podrás modificar la información de las solicitudes.</p>
      {/* Aquí va el contenido específico del Dashboard */}
    </div>
    </AdminGate>
  );
};

export default Control;