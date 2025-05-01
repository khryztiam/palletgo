// /src/components/admin/control/OrderModal.js
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FaTimes } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import Select from 'react-select';

Modal.setAppElement('#__next');

const OrderModal = ({ order, isOpen, onClose, onSave }) => {
  const [status, setStatus] = useState(order.status || '');
  const [comments, setComments] = useState(order.comments || '');
  const [destiny, setDestiny] = useState(order.destiny || '');
  const [userDeliver, setUserDeliver] = useState(order.user_deliver || '');
  const [userSubmit, setUserSubmit] = useState(order.user_submit || '');
  const [area, setArea] = useState(order.area || '');
  const [details, setDetails] = useState(order.details || []);
  const [userOptions, setUserOptions] = useState([]);
  const [detailOptions, setDetailOptions] = useState([]); // Para opciones de detalle

  useEffect(() => {
    setStatus(order.status || '');
    setComments(order.comments || '');
    setDestiny(order.destiny || '');
    setUserDeliver(order.user_deliver || '');
    setUserSubmit(order.user_submit || '');
    setArea(order.area || '');
  }, [order]);

  useEffect(() => {
    setDetails(order.details || []);
  }, [order]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('list_users')
        .select('user_deliver');

      if (error) {
        console.error('Error cargando usuarios:', error.message);
      } else {
        setUserOptions(data.map((row) => row.user_deliver));
      }
    };

    const fetchDetailOptions = async () => {
      const { data, error } = await supabase
        .from('detail_options')
        .select('*')
        .order('label', { ascending: true });

      if (error) {
        console.error('Error cargando opciones de detalle:', error.message);
      } else {
        setDetailOptions(data);
      }
    };

    fetchUsers();
    fetchDetailOptions();
  }, []);

  const handleSave = async () => {
    const updatedOrder = {
      ...order,
      status,
      comments,
      destiny,
      details,
      user_deliver: userDeliver,
      user_submit: userSubmit,
      area,
    };

    if (
      status === 'ENTREGADO' &&
      order.status !== 'ENTREGADO' &&
      !order.date_delivery
    ) {
      updatedOrder.date_delivery = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updatedOrder)
      .eq('id_order', order.id_order);

    if (error) {
      console.error('Error actualizando la orden:', error.message);
    } else {
      alert('Orden actualizada con éxito');
      onSave(updatedOrder);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Modificar Orden"
      className="control-modal-content"
      overlayClassName="control-modal-overlay"
    >
      <div className="control-modal-header">
        <h2>Modificar Orden #{order.id_order}</h2>
        <button onClick={onClose}><FaTimes /></button>
      </div>

      <div className="control-modal-body">
        <div>
          <label>Área:</label>
          <input value={area} onChange={(e) => setArea(e.target.value)} />
        </div>

        <div>
          <label>Solicitado por:</label>
          <input value={userSubmit} onChange={(e) => setUserSubmit(e.target.value)} />
        </div>

        {/* Opciones de detalle - Cargar desde la base de datos */}
        <div className="form-group">
          <label>Detalles:</label>
          <Select
            isMulti
            options={detailOptions.map(opt => ({ value: opt.value, label: opt.label }))}
            value={detailOptions
              .filter(opt => details.includes(opt.value))
              .map(opt => ({ value: opt.value, label: opt.label }))}
            onChange={(selected) => {
              setDetails(selected ? selected.map(opt => opt.value) : []);
            }}
            placeholder="Seleccione los detalles..."
            noOptionsMessage={() => "No hay más opciones"}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        <div>
          <label>Estado:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">-- Seleccionar --</option>
            <option value="SOLICITADO">SOLICITADO</option>
            <option value="EN PROGRESO">EN PROGRESO</option>
            <option value="ENTREGADO">ENTREGADO</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>
        </div>

        <div>
          <label>Destino:</label>
          <select value={destiny} onChange={(e) => setDestiny(e.target.value)}>
            <option value="">-- Seleccionar --</option>
            <option value="EPC">EPC</option>
            <option value="EMPAQUE">EMPAQUE</option>
          </select>
        </div>

        <div>
          <label>Entregado por:</label>
          <select value={userDeliver} onChange={(e) => setUserDeliver(e.target.value)}>
            <option value="">-- Seleccionar --</option>
            {userOptions.map((user, idx) => (
              <option key={idx} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Comentarios:</label>
          <textarea value={comments} onChange={(e) => setComments(e.target.value)} />
        </div>
      </div>

      <div className="control-modal-footer">
        <button onClick={handleSave}>Guardar cambios</button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    </Modal>
  );
};

export default OrderModal;
