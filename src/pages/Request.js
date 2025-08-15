import React, { useState, useEffect } from "react";
import Select from "react-select";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import RoleGate from "../components/RoleGate";
import { Card } from "../components/Card";
import Modal from "react-modal"; // Importa react-modal

// Configurar el elemento de la app para el modal
Modal.setAppElement("#__next"); // Es necesario para mejorar la accesibilidad

export default function Request() {
  const { userName, role } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailOptions, setDetailOptions] = useState([]); // Para opciones de detalle

  const [formData, setFormData] = useState({
    area: userName,
    user_submit: "",
    details: [],
    destiny: "",
    comments: "",
  });

  // Opciones para el select de destino
  const destinyOptions = ["EMBARQUE", "EPC"];

  // Cargar órdenes
  const fetchOrders = async () => {
    let query = supabase
      .from("orders")
      .select("*")
      .not("status", "in", '("ENTREGADO","CANCELADO")')
      .order("date_order", { ascending: false });

    // Solo filtrar por área si NO es admin
    if (role !== "ADMIN") {
      query = query.eq("area", userName);
    }

    const { data, error } = await query;

    if (!error) setOrders(data || []);
  };

  // Cargar las opciones de detalles desde la tabla `detail_options`
  const fetchDetailOptions = async () => {
    const { data, error } = await supabase
      .from("detail_options") // Nombre de la tabla en Supabase
      .select("value, label"); // Supón que tienes los campos 'value' y 'label' en tu tabla

    if (!error) {
      const options = data.map((item) => ({
        value: item.value, // Usar el valor de la columna 'value'
        label: item.label, // Usar el valor de la columna 'label'
      }));
      setDetailOptions(options); // Actualiza el estado con las opciones cargadas
    }
  };

  useEffect(() => {
    // Cargar las órdenes iniciales y las opciones de detalle
    fetchOrders();
    fetchDetailOptions();

    // Configurar la suscripción en tiempo real
    const channel = supabase
      .channel("realtime-orders")
.on("postgres_changes",
  { event: "INSERT", schema: "public", table: "orders" },
  (payload) => {
    const newOrder = payload.new;
    if (
      newOrder.status !== "ENTREGADO" &&
      (role === "ADMIN" || newOrder.area === userName)
    ) {
      setOrders((prev) => [...prev, newOrder]);
    }
  }
)
.on("postgres_changes",
  { event: "UPDATE", schema: "public", table: "orders" },
  (payload) => {
    const updatedOrder = payload.new;
    if (role !== "ADMIN" && updatedOrder.area !== userName) return; // 🔹 Evita mostrar órdenes ajenas

    if (updatedOrder.status === "ENTREGADO") {
      setOrders((prev) =>
        prev.filter((order) => order.id_order !== updatedOrder.id_order)
      );
    } else {
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Crear nueva orden
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.user_submit) {
      alert("Nombre del solicitante es obligatorio");
      return;
    }

    const { error } = await supabase.from("orders").insert([
      {
        ...formData,
        details: formData.details,
        area: userName || "Área no especificada",
        status: "SOLICITADO", // Estado inicial consistente con Card
        date_order: new Date().toISOString(),
      },
    ]);

    if (!error) {
      await fetchOrders();
      setIsModalOpen(false); // Cerrar el modal después de guardar
      setFormData({
        area: userName ?? "",
        user_submit: "",
        details: [],
        destiny: "",
        comments: "",
      });
    }
  };

  useEffect(() => {
    // Actualizar el valor de 'area' cuando userName cambie
    if (userName) {
      setFormData((prev) => ({
        ...prev,
        area: userName,
      }));
    }
  }, [userName]);

  return (
    <RoleGate allowedRoles={["LINEA"]}>
      <div className="request-container">
        <h1>Solicitudes</h1>

        <button
          onClick={() => {
            setFormData({
              area: userName ?? "",
              user_submit: "",
              details: [],
              destiny: "",
              comments: "",
            });
            setIsModalOpen(true);
          }}
          className="floating-btn"
        >
          Solicitar
        </button>

        {/* Listado de órdenes */}
        <div className="request-grid">
          {orders.map((order) => (
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
          onRequestClose={() => setIsModalOpen(false)} // Cierra el modal cuando se hace clic fuera de él
          contentLabel="Nueva Solicitud"
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          <h2>Nueva Solicitud</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Area:</label>
              <input type="text" name="area" value={formData.area} readOnly />
            </div>

            <div className="form-group">
              <label>Solicitante *</label>
              <input
                type="text"
                name="user_submit"
                value={formData.user_submit}
                onChange={handleChange}
                required
                placeholder="Escriba su nombre..."
              />
            </div>

            <div className="form-group">
              <label>Detalles (Selección múltiple)</label>
              <Select
                isMulti
                options={detailOptions} // Ahora se utilizan las opciones cargadas desde la base de datos
                value={detailOptions.filter((opt) =>
                  formData.details.includes(opt.value)
                )}
                onChange={(selected) => {
                  setFormData((prev) => ({
                    ...prev,
                    details: selected.map((opt) => opt.value),
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
                {destinyOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
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
                Enviar Solicitud
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </RoleGate>
  );
}
