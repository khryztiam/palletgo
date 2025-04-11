import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import Modal from 'react-modal';  // Importa react-modal


// Configurar el elemento de la app para el modal
Modal.setAppElement('#__next');  // Es necesario para mejorar la accesibilidad

export default function Request() {
  const { userName } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    area: userName ?? '',
    user_submit: '',
    details: [],
    destiny: '',
    comments: ''
  });

  // Opciones para los selects
  const detailOptions = [
    { value: 'CARTON', label: 'CARTON' },
    { value: 'CONTENEDOR VACIO', label: 'CONTENEDOR VACIO' },
    { value: 'TOTEN VACIOS', label: 'TOTEN VACIOS' },
    { value: 'CAJA LARGA P/AEREO', label: 'CAJA LARGA P/AEREO' },
    { value: 'CAJA GRANDE P/AEREO', label: 'CAJA GRANDE P/AEREO' },
    { value: 'RETIRO DE CONTENEDOR', label: 'RETIRO DE CONTENEDOR' },
    { value: 'RETIRO DE TARIMA', label: 'RETIRO DE TARIMA' },
    { value: 'TARIMA VACIA', label: 'TARIMA VACIA' },
    { value: 'CAJAS VACIAS', label: 'CAJAS VACIAS' }
  ];
  const destinyOptions = ['EMBARQUE', 'EPC'];

  // Cargar órdenes
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'ENTREGADO')
      .order('date_order', { descending: false });

    if (!error) setOrders(data || []);
  };

  useEffect(() => {
    // Cargar las órdenes iniciales
    fetchOrders();

    // Configurar la suscripción en tiempo real
    const channel = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new;
          if (newOrder.status !== 'ENTREGADO') {
            console.log('Nueva solicitud:', newOrder);
            setOrders((prev) => [...prev, newOrder]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const updatedOrder = payload.new;
          if (updatedOrder.status === 'ENTREGADO') {
            // Si ya está entregado, la quitamos de la lista
            setOrders((prev) =>
              prev.filter(order => order.id_order !== updatedOrder.id_order)
            );
          } else {
            // Si no está entregado, actualizamos normal
            setOrders((prev) =>
              prev.map((order) =>
                order.id_order === updatedOrder.id_order ? updatedOrder : order
              )
            );
          }
        }
      )
      .subscribe();

    // Limpiar la suscripción cuando el componente se desmonte
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Solo se ejecuta una vez, al montar el componente


  // Manejar cambios en el form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Crear nueva orden
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.user_submit) {
      alert('Nombre del solicitante es obligatorio');
      return;
    }

    const { error } = await supabase
      .from('orders')
      .insert([{
        ...formData,
        details: formData.details,
        area: userName || 'Área no especificada',
        status: 'SOLICITADO', // Estado inicial consistente con Card
        date_order: new Date().toISOString()
      }]);

    if (!error) {
      await fetchOrders();
      setIsModalOpen(false);  // Cerrar el modal después de guardar
      setFormData({
        area: userName ?? '',
        user_submit: '',
        details: [],
        destiny: '',
        comments: ''
      });
    }
  };

  useEffect(() => {
    // Actualizar el valor de 'area' cuando userName cambie
    if (userName) {
      setFormData(prev => ({
        ...prev,
        area: userName
      }));
    }
  }, [userName]); 

  return (
    <div className="request-container">
      <h1>Solicitudes</h1>
      
      <button 
        onClick={() => {
          setFormData({
            area: userName ?? '',
            user_submit: '',
            details: [],
            destiny: '',
            comments: ''
          });
          setIsModalOpen(true);
        }}
        className="floating-btn"
      >
        + Solicitar
      </button>

      {/* Listado de órdenes */}
      <div className="request-grid">
        {orders.map(order => (
          <Card 
            key={`order-${order.id_order}`}
            order={order}
            variant="default"
          />
        ))}
      </div>

      {/* Modal de creación */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}  // Cierra el modal cuando se hace clic fuera de él
        contentLabel="Nueva Solicitud"
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <h2>Nueva Solicitud</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Area:</label>
            <input
              type="text"
              name="area"
              value={formData.area}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Solicitante *</label>
            <input
              type="text"
              name="user_submit"
              value={formData.user_submit}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Detalles (Selección múltiple)</label>
            <Select
              isMulti
              options={detailOptions}
              value={detailOptions.filter(opt => formData.details.includes(opt.value))}
              onChange={(selected) => {
                setFormData(prev => ({
                  ...prev,
                  details: selected.map(opt => opt.value)
                }));
              }}
              placeholder="Seleccione los detalles..."
              noOptionsMessage={() => "No hay más opciones"}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          <div className="form-group">
            <label>Destino</label>
            <select
              name="destiny"
              value={formData.destiny}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
              {destinyOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Comentarios</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              rows={3}
              placeholder="Información adicional..."
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="cancel-button"
            >
              Cancelar
            </button>
            <button type="submit" className="submit-button">
              Guardar Solicitud
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
