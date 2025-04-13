import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Modal from 'react-modal';
import RoleGate from '../components/RoleGate';

// Configurar el elemento de la app para el modal
Modal.setAppElement('#__next');  // Es necesario para mejorar la accesibilidad

export default function Boarding() {
  const [deliverers, setDeliverers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isDelivererModalOpen, setIsDelivererModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [currentDeliverer, setCurrentDeliverer] = useState({ user_deliver: '' });
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch deliverers
        const { data: deliverersData } = await supabase
          .from('list_users')
          .select('*');
        setDeliverers(deliverersData);

        // Fetch last 25 orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .order('date_order', { ascending: false })
          .limit(25);
        setOrders(ordersData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRowClick = (deliverer) => {
    setCurrentDeliverer(deliverer);
    setHasChanges(false);
    setIsDelivererModalOpen(true);
  };

  const handleOrderRowClick = (order) => {
    setCurrentOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleDelivererChange = (e) => {
    setCurrentDeliverer({
      ...currentDeliverer,
      user_deliver: e.target.value
    });
    setHasChanges(true);
  };

  const handleSaveDeliverer = async () => {
    try {
      if (currentDeliverer.id) {
        await supabase
          .from('list_users')
          .update({ user_deliver: currentDeliverer.user_deliver })
          .eq('id', currentDeliverer.id);
      } else {
        await supabase
          .from('list_users')
          .insert([{ user_deliver: currentDeliverer.user_deliver }]);
      }

      // Refresh data
      const { data } = await supabase.from('list_users').select('*');
      setDeliverers(data);
      setIsDelivererModalOpen(false);
    } catch (error) {
      console.error('Error saving deliverer:', error);
    }
  };

  const handleDeleteDeliverer = async () => {
    if (window.confirm('¿Estás seguro de eliminar este entregador?')) {
      try {
        await supabase
          .from('list_users')
          .delete()
          .eq('id', currentDeliverer.id);

        const { data } = await supabase.from('list_users').select('*');
        setDeliverers(data);
        setIsDelivererModalOpen(false);
      } catch (error) {
        console.error('Error deleting deliverer:', error);
      }
    }
  };

  if (loading) return <div className="boarding-container">Loading...</div>;

  return (
    <RoleGate allowedRoles={['EMBARQUE']}>
    <div className="boarding-container">
      <h1 className="boarding-title">Embarque</h1>
      <p className="boarding-description">Registro de embarques programados.</p>

      <div className="boarding-panels-container">
        {/* Deliverers Panel - Más compacto */}
        <div className="boarding-panel boarding-deliverers-panel">
          <div className="boarding-panel-header">
            <h2 className="boarding-panel-title">Entregadores</h2>
            <button 
              onClick={() => {
                setCurrentDeliverer({ user_deliver: '' });
                setHasChanges(false);
                setIsDelivererModalOpen(true);
              }} 
              className="boarding-add-button"
            >
              + Agregar
            </button>
          </div>
          <div className="boarding-panel-content">
            <table className="boarding-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                </tr>
              </thead>
              <tbody>
                {deliverers.map((deliverer) => (
                  <tr 
                    key={deliverer.id} 
                    onClick={() => handleRowClick(deliverer)}
                    className="boarding-clickable-row"
                  >
                    <td>{deliverer.user_deliver}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders Panel - Más espacio */}
        <div className="boarding-panel boarding-orders-panel">
          <div className="boarding-panel-header">
            <h2 className="boarding-panel-title">Últimas 25 solicitudes</h2>
          </div>
          <div className="boarding-panel-content">
            <table className="boarding-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Área</th>
                  <th>Estado</th>
                  <th>Destino</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr 
                    key={order.id_order} 
                    onClick={() => handleOrderRowClick(order)}
                    className="boarding-clickable-row"
                  >
                    <td>{new Date(order.date_order).toLocaleDateString()}</td>
                    <td>{order.area}</td>
                    <td>{order.status}</td>
                    <td>{order.destiny}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deliverer Modal */}
      <Modal
        isOpen={isDelivererModalOpen}
        onRequestClose={() => setIsDelivererModalOpen(false)}
        className="boarding-modal"
        overlayClassName="boarding-modal-overlay"
      >
        <h2>{currentDeliverer?.id ? 'Editar Entregador' : 'Nuevo Entregador'}</h2>
        <div className="boarding-modal-form">
          <div className="boarding-form-group">
            <label>Nombre del entregador:</label>
            <input
              type="text"
              value={currentDeliverer?.user_deliver || ''}
              onChange={handleDelivererChange}
              autoFocus
            />
          </div>
          <div className="boarding-modal-buttons">
            {currentDeliverer?.id && (
              <button 
                onClick={handleDeleteDeliverer}
                className="boarding-delete-button"
              >
                Eliminar
              </button>
            )}
            <button 
              onClick={() => setIsDelivererModalOpen(false)}
              className="boarding-cancel-button"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSaveDeliverer}
              className="boarding-save-button"
              disabled={!hasChanges && !!currentDeliverer?.id}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>


      {/* Order Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onRequestClose={() => setIsOrderModalOpen(false)}
        className="boarding-modal boarding-order-modal"
        overlayClassName="boarding-modal-overlay"
      >
        <h2>Detalles de la Orden</h2>
          {currentOrder && (
            <div className="boarding-order-content">
              <div className="boarding-order-field">
                <span className="boarding-order-label">ID:</span>
                <span className="boarding-order-value">{currentOrder.id_order}</span>
              </div>
              <div className="boarding-order-field">
                <span className="boarding-order-label">Fecha:</span>
                <span className="boarding-order-value">
                  {new Date(currentOrder.date_order).toLocaleString()}
                </span>
              </div>
              <div className="boarding-order-field">
                <span className="boarding-order-label">Área:</span>
                <span className="boarding-order-value">{currentOrder.area}</span>
              </div>
              <div className="boarding-order-field">
                <span className="boarding-order-label">Solicitante:</span>
                <span className="boarding-order-value">{currentOrder.user_submit}</span>
              </div>
              <div className="boarding-order-field">
                <span className="boarding-order-label">Destino:</span>
                <span className="boarding-order-value">{currentOrder.destiny}</span>
              </div>
              <div className="boarding-order-field">
                <span className="boarding-order-label">Estado:</span>
                <span className={`boarding-order-status boarding-status-${currentOrder.status.toLowerCase().replace(' ', '-')}`}>
                  {currentOrder.status}
                </span>
              </div>
              <div className="boarding-order-details">
                <span className="boarding-order-label">Detalles:</span>
                <ul className="boarding-order-list">
                  {currentOrder.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </div>
              <div className="boarding-order-buttons">
                <button 
                  className="boarding-order-close"
                  onClick={() => setIsOrderModalOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </Modal>
    </div>
    </RoleGate>
  );
}