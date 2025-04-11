import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';


export const StatusModal = ({ 
  order, 
  onClose, 
  onConfirm 
}) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(order.user_deliver || '');
  const [selectedStatus, setSelectedStatus] = useState(
    order.status === 'SOLICITADO' ? 'EN PROGRESO' : 'ENTREGADO'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('list_users')
        .select('user_deliver')
        .order('id', { ascending: true });
      setUsers(data || []);
    };
    fetchUsers();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const updates = {
      status: selectedStatus,
      user_deliver: selectedUser,
      ...(selectedStatus === 'ENTREGADO' && { 
        date_delivery: new Date().toISOString() 
      })
    };

    await onConfirm(order.id_order, updates);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="status-modal-overlay">
      <div className="status-modal-content">
        <h3>Actualizar Estado - Orden #{order.id_order}</h3>
        
        <div className="form-group">
          <label>Responsable:</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            required
            className="user-select"
          >
            <option value="">Seleccione responsable...</option>
            {users.map(user => (
              <option key={user.user_deliver} value={user.user_deliver}>
                {user.user_deliver}
              </option>
            ))}
          </select>
        </div>   

        <div className="form-group">
          <label>Estado:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="status-select"
          >
            <option value="EN PROGRESO">EN PROGRESO</option>
            <option value="ENTREGADO">ENTREGADO</option>
          </select>
        </div>

        {selectedStatus === 'ENTREGADO' && (
          <div className="delivery-info">
            <p>Se registrará fecha y hora actual al confirmar</p>
          </div>
        )}

        <div className="modal-actions">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isSubmitting}
            className="cancel-btn"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!selectedUser || isSubmitting}
            className="confirm-btn"
          >
            {isSubmitting ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};