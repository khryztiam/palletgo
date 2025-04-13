// /src/components/admin/control/DetailOptionsPanel.js
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from 'react-modal'; // Usando la librería react-modal

// Asegúrate de que el modal sea accesible para pantallas pequeñas
Modal.setAppElement('#__next');

const DetailOptionsPanel = () => {
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState('');
  const [editingOption, setEditingOption] = useState(null);
  const [editedOption, setEditedOption] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // Para diferenciar entre agregar, editar y eliminar

  // Cargar opciones de detalles desde Supabase
  useEffect(() => {
    const fetchOptions = async () => {
      const { data, error } = await supabase
        .from('detail_options') // Supongamos que tienes esta tabla
        .select('*')
        .order('label', { ascending: true });

      if (error) {
        console.error('Error cargando opciones de detalle:', error.message);
      } else {
        setOptions(data);
      }
    };

    fetchOptions();
  }, []); // Solo se ejecuta una vez al montar el componente

  // Función para agregar una nueva opción
  const handleAddOption = async () => {
    if (!newOption.trim()) return; // Validación para evitar vacíos

    const { data, error } = await supabase
      .from('detail_options')
      .insert([{ label: newOption.trim() }]);

    if (error) {
      console.error('Error agregando la opción:', error.message);
    } else {
      setOptions((prev) => [...prev, ...data]);
      setNewOption('');
      setModalIsOpen(false); // Cerrar el modal después de agregar
    }
  };

  // Función para editar una opción
  const handleEditOption = async () => {
    if (!editedOption.trim()) return;

    const { data, error } = await supabase
      .from('detail_options')
      .update({ label: editedOption.trim() })
      .eq('id', editingOption.id);

    if (error) {
      console.error('Error editando la opción:', error.message);
    } else {
      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === editingOption.id ? { ...opt, label: editedOption.trim() } : opt
        )
      );
      setEditingOption(null);
      setEditedOption('');
      setModalIsOpen(false); // Cerrar el modal después de editar
    }
  };

  // Función para eliminar una opción
  const handleDeleteOption = async () => {
    const { error } = await supabase
      .from('detail_options')
      .delete()
      .eq('id', editingOption.id);

    if (error) {
      console.error('Error eliminando la opción:', error.message);
    } else {
      setOptions((prev) => prev.filter((opt) => opt.id !== editingOption.id));
      setEditingOption(null);
      setModalIsOpen(false); // Cerrar el modal después de eliminar
    }
  };

  // Funciones para abrir y cerrar el modal
  const openModal = (type, option = null) => {
    setActionType(type);
    if (type === 'edit' && option) {
      setEditingOption(option);
      setEditedOption(option.label);
    } else {
      setNewOption('');
    }
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setActionType('');
    setEditingOption(null);
    setEditedOption('');
    setNewOption('');
  };

  return (
    <div className="detail-options-panel">
      <h2>Opciones de Detalles</h2>

      {/* Botones fuera de la tabla */}
      <div className="options-buttons">
        <button onClick={() => openModal('add')} className="add-button">Agregar Opción</button>
        <button onClick={() => openModal('edit', editingOption)} className="edit-button">Editar Opción</button>
        <button onClick={() => openModal('delete', editingOption)} className="delete-button">Eliminar Opción</button>
      </div>

      {/* Mostrar las opciones de detalle */}
      <ul className="options-list">
        {options.length > 0 ? (
          options.map((option) => (
            <li key={option.id} className="option-item">
              <span>{option.label}</span>
            </li>
          ))
        ) : (
          <p>No hay opciones disponibles.</p>
        )}
      </ul>

      {/* Modal para agregar, editar y eliminar */}
      <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="modal-overlay">
        <div className="modal-content">
        <h2>{actionType === 'add' ? 'Agregar Opción' : actionType === 'edit' ? 'Editar Opción' : 'Eliminar Opción'}</h2>
        
        {/* Modal para agregar opción */}
        {actionType === 'add' && (
          <><div className='form-group'>
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Escribe la nueva opción"
            /></div>
            <div className='form-actions'>
            <button onClick={handleAddOption} className="submit-button">Guardar</button>
            <button onClick={closeModal} className="cancel-button">Cancelar</button>
            </div>
          </>
        )}

        {/* Modal para editar opción */}
        {actionType === 'edit' && (
          <><div className='form-group'>
            <input
              type="text"
              value={editedOption}
              onChange={(e) => setEditedOption(e.target.value)}
              placeholder="Edita la opción"
            /></div>
            <div className='form-actions'>
            <button onClick={handleEditOption} className="submit-button">Guardar</button>
            <button onClick={closeModal} className="cancel-button">Cancelar</button>
            </div>          
          </>
        )}

        {/* Modal para eliminar opción */}
        {actionType === 'delete' && (
          <><div className='form-group'>
            <p>¿Estás seguro de que deseas eliminar esta opción?</p></div>
            <div className='form-actions'>
            <button onClick={handleDeleteOption} className="submit-button">Eliminar</button>
            <button onClick={closeModal} className="cancel-button">Cancelar</button>
            </div>
          </>
        )}
        
        </div>
      </Modal>
    </div>
  );
};

export default DetailOptionsPanel;
