// /src/components/admin/control/DetailOptionsPanel.js
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from 'react-modal';

Modal.setAppElement('#__next');

const DetailOptionsPanel = () => {
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState('');
  const [editingOption, setEditingOption] = useState(null);
  const [editedOption, setEditedOption] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [mode, setMode] = useState(''); // 'add' | 'manage'

  // Fetch
  const fetchOptions = async () => {
    const { data, error } = await supabase
      .from('detail_options')
      .select('*')
      .order('label', { ascending: true });
    if (error) console.error('Error cargando opciones:', error.message);
    else setOptions(data);
  };

  useEffect(fetchOptions, []);

  // Open modal
  const openAddModal = () => {
    setMode('add');
    setNewOption('');
    setEditingOption(null);
    setModalIsOpen(true);
  };
  const openManageModal = (option) => {
    setMode('manage');
    setEditingOption(option);
    setEditedOption(option.label);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setMode('');
    setEditingOption(null);
    setEditedOption('');
    setNewOption('');
  };

  // Handlers
  const handleAdd = async () => {
    if (!newOption.trim()) return;
    const { data, error } = await supabase
      .from('detail_options')
      .insert([{ label: newOption.trim() }]);
    if (error) console.error('Error agregando:', error.message);
    else {
      setOptions(prev => [...prev, ...data]);
      closeModal();
    }
  };

  const handleEdit = async () => {
    if (!editedOption.trim()) return;
    const { error } = await supabase
      .from('detail_options')
      .update({ label: editedOption.trim() })
      .eq('id', editingOption.id);
    if (error) console.error('Error editando:', error.message);
    else {
      setOptions(prev =>
        prev.map(opt =>
          opt.id === editingOption.id ? { ...opt, label: editedOption.trim() } : opt
        )
      );
      closeModal();
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('detail_options')
      .delete()
      .eq('id', editingOption.id);
    if (error) console.error('Error eliminando:', error.message);
    else {
      setOptions(prev => prev.filter(opt => opt.id !== editingOption.id));
      closeModal();
    }
  };

  return (
    <div className="detail-options-panel">
      <h2>Opciones de Detalles</h2>
      <div className="options-buttons">
      <button onClick={openAddModal} className="add-button">
        + Agregar Opción
      </button>
      </div>
      <ul className="options-list">
        {options.length > 0 ? (
          options.map(option => (
            <li
              key={option.id}
              className={`option-item ${
                editingOption?.id === option.id ? 'selected' : ''
              }`}
              onClick={() => openManageModal(option)}
            >
              {option.label}
            </li>
          ))
        ) : (
          <p>No hay opciones disponibles.</p>
        )}
      </ul>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        overlayClassName="control-modal-overlay"
        className="control-modal-content"
      >
        {mode === 'add' ? (
          <>
            <h2>Agregar Opción</h2>
            <div className='control-modal'>
            <div className='control-form-group'>
            <input
              type="text"
              value={newOption}
              onChange={e => setNewOption(e.target.value)}
              placeholder="Escribe la nueva opción"
              className='control-form-control'
            />
            </div>
            <div className="control-actions">
              <button onClick={handleAdd} className="submit-button">
                Guardar
              </button>
              <button onClick={closeModal} className="cancel-button">
                Cancelar
              </button>
            </div>
            </div>
          </>
        ) : (
          <>
            <h2>Gestionar Opción</h2>
            <div className='control-modal'>
            <div className='control-form-group'>
            <input
              type="text"
              value={editedOption}
              onChange={e => setEditedOption(e.target.value)}
              placeholder="Edita la opción"
              className='control-form-control'
            />
            </div>
            <div className="control-actions">
              <button onClick={handleEdit} className="management-primary-btn">
                Guardar
              </button>
              <button onClick={handleDelete} className="management-secondary-btn">
                Eliminar
              </button>
              <button onClick={closeModal} className="management-danger-btn">
                Cancelar
              </button>
            </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default DetailOptionsPanel;
