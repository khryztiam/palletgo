// src/components/admin/control/DetailOptionsPanel.js
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from 'react-modal';
import styles from '@/styles/Control.module.css';

Modal.setAppElement('#__next');

// ─── DetailOptionsPanel ───────────────────────────────────────────────────────
const DetailOptionsPanel = () => {
  const [options,       setOptions]       = useState([]);
  const [newOption,     setNewOption]     = useState('');
  const [editingOption, setEditingOption] = useState(null);
  const [editedOption,  setEditedOption]  = useState('');
  const [modalIsOpen,   setModalIsOpen]   = useState(false);
  const [mode,          setMode]          = useState(''); // 'add' | 'manage'

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchOptions = useCallback(async () => {
    const { data, error } = await supabase
      .from('detail_options')
      .select('*')
      .order('label', { ascending: true });

    if (error) console.error('Error cargando opciones:', error.message);
    else setOptions(data);
  }, []);

  useEffect(() => { fetchOptions(); }, [fetchOptions]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
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

  // ── Handlers CRUD ──────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newOption.trim()) return;
    const { data, error } = await supabase
      .from('detail_options')
      .insert([{ label: newOption.trim() }])
      .select(); // Retorna el registro insertado

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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.detailOptionsPanel}>
      <h2>Opciones de Detalles</h2>

      <div className={styles.optionsButtons}>
        <button onClick={openAddModal}>+ Agregar Opción</button>
      </div>

      <ul className={styles.optionsList}>
        {options.length > 0 ? (
          options.map(option => (
            <li
              key={option.id}
              className={styles.optionItem}
              onClick={() => openManageModal(option)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openManageModal(option)}
            >
              <span>{option.label}</span>
              <button
                className={styles.editOptionBtn}
                onClick={(e) => { e.stopPropagation(); openManageModal(option); }}
                aria-label={`Editar ${option.label}`}
              >
                Editar
              </button>
            </li>
          ))
        ) : (
          <p style={{ color: '#718096', fontStyle: 'italic' }}>
            No hay opciones disponibles.
          </p>
        )}
      </ul>

      {/* Modal de agregar / editar */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        overlayClassName={styles.modalOverlay}
        className={styles.modalContent}
        contentLabel={mode === 'add' ? 'Agregar Opción' : 'Gestionar Opción'}
      >
        <div className={styles.modalHeader}>
          <h2>{mode === 'add' ? 'Agregar Opción' : 'Gestionar Opción'}</h2>
          <button onClick={closeModal} className={styles.modalClose} aria-label="Cerrar">
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label>{mode === 'add' ? 'Nueva opción:' : 'Editar opción:'}</label>
            <input
              type="text"
              value={mode === 'add' ? newOption : editedOption}
              onChange={(e) =>
                mode === 'add'
                  ? setNewOption(e.target.value)
                  : setEditedOption(e.target.value)
              }
              placeholder={mode === 'add' ? 'Escribe la nueva opción...' : 'Edita la opción...'}
              autoFocus
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          {mode === 'manage' && (
            <div className={styles.footerLeft}>
              <button onClick={handleDelete} className={styles.deleteBtn}>
                Eliminar
              </button>
            </div>
          )}
          <div className={styles.footerRight}>
            <button onClick={closeModal} className={styles.cancelBtn}>
              Cancelar
            </button>
            <button
              onClick={mode === 'add' ? handleAdd : handleEdit}
              className={styles.saveBtn}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DetailOptionsPanel;