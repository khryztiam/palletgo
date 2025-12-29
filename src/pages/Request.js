import React, { useState, useEffect } from "react";
import Select from "react-select";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import RoleGate from "../components/RoleGate";
import { Card } from "../components/Card";
import Modal from "react-modal"; // Importa react-modal
import ChristmasCountdown from "../components/countdown";

// Configurar el elemento de la app para el modal
Modal.setAppElement("#__next"); // Es necesario para mejorar la accesibilidad

// Constantes para los detalles que activan los nuevos campos
const RETIRO_CONTENEDOR = "RETIRO DE CONTENEDOR";
const RETIRO_TARIMA = "RETIRO DE TARIMA";

export default function Request() {
  const { userName, role } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailOptions, setDetailOptions] = useState([]); // Para opciones de detalle
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    area: userName,
    user_submit: "",
    details: [],
    destiny: "",
    comments: "",
    print_label: "", // Nuevo campo
    multilabel: [], // Nuevo campo
  });

  // Estados para controlar la visibilidad de los campos
  const [showPrintLabel, setShowPrintLabel] = useState(false);
  const [showMultiLabel, setShowMultiLabel] = useState(false);

  // Referencia para e input por escaner
  const multiLabelInputRef = React.useRef(null);

  // Opciones para el select de destino
  const destinyOptions = ["EMBARQUE", "EPC"];

  // Efecto para mostrar/ocultar campos basado en los detalles seleccionados
  useEffect(() => {
    const hasRetiroContenedor = formData.details.includes(RETIRO_CONTENEDOR);
    const hasRetiroTarima = formData.details.includes(RETIRO_TARIMA);

    setShowPrintLabel(hasRetiroContenedor);
    setShowMultiLabel(hasRetiroTarima);

    // Limpiar campos cuando se deseleccionan los detalles
    if (!hasRetiroContenedor) {
      setFormData(prev => ({ ...prev, print_label: "" }));
    }
    if (!hasRetiroTarima) {
      setFormData(prev => ({ ...prev, multilabel: [] }));
    }
  }, [formData.details]);

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
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const newOrder = payload.new;
          if (
            newOrder.status !== "ENTREGADO" &&
            (role === "ADMIN" || newOrder.area === userName)
          ) {
            setOrders((prev) => {
              // 🔹 Verificación de duplicados añadida aquí
              const exists = prev.some((o) => o.id_order === newOrder.id_order);
              if (exists) return prev;
              return [newOrder, ...prev];
            });
          }
        }
      )
      .on(
        "postgres_changes",
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
              prev.map((o) =>
                o.id_order === updatedOrder.id_order ? updatedOrder : o
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
  }, []);

  // Manejar cambios en el form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar cambios en el campo multilabel (array)
  const handleMultiLabelChange = (e) => {
    const value = e.target.value;
    
    // Convertir el texto en array separado por comas y limpiar espacios
    const labelsArray = value
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '')
      .slice(0, 4); // Limitar a máximo 4 elementos

    setFormData((prev) => ({ 
      ...prev, 
      multilabel: labelsArray 
    }));
  };

  // Crear nueva orden
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.user_submit) {
      alert("Nombre del solicitante es obligatorio");
      return;
    }

    // Validaciones específicas para los campos condicionales
    if (showPrintLabel && !formData.print_label.trim()) {
      alert("La etiqueta de contenedor es obligatoria cuando se selecciona 'Retiro de contenedor'");
      return;
    }

    if (showMultiLabel && formData.multilabel.length === 0) {
      alert("Debe ingresar al menos una etiqueta de tarima cuando se selecciona 'Retiro de tarima'");
      return;
    }

    if (showMultiLabel && formData.multilabel.length > 4) {
      alert("Máximo 4 etiquetas de tarima permitidas");
      return;
    }

    // 1. INICIAR CARGA: Deshabilita el botón
    setIsLoading(true);

    const { error } = await supabase.from("orders").insert([
      {
        ...formData,
        details: formData.details,
        area: userName || "Área no especificada",
        status: "SOLICITADO",
        date_order: new Date().toISOString(),
        print_label: showPrintLabel ? formData.print_label : null, // Solo enviar si está visible
        multilabel: showMultiLabel ? formData.multilabel : [], // Solo enviar array si está visible
      },
    ]);

    if (!error) {
      // Éxito
      console.log("Solicitud enviada con éxito."); // o alert("Solicitud enviada con éxito!")
      setIsModalOpen(false);
      setFormData({
        area: userName ?? "",
        user_submit: "",
        details: [],
        destiny: "",
        comments: "",
        print_label: "", // Nuevo campo
        multilabel: [], // Nuevo campo
      });
    } else {
      // Manejo de error
      console.error("Error al enviar solicitud:", error.message);
      alert(`Error al enviar la solicitud: ${error.message}`); // Retroalimentación visible al usuario
    }

    // 2. FINALIZAR CARGA: Habilita el botón de nuevo (se ejecuta después del if/else)
    setIsLoading(false);
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

  // Función para obtener el valor de display del multilabel
  const getMultiLabelDisplay = () => {
    return formData.multilabel.join(', ');
  };

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
              print_label: "", // Nuevo campo
              multilabel: [], // Nuevo campo
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

{/*Nuevo campo debe estar oculto por default a no ser que se seleccione en Detalles Retiro de contenedor*/}
             
             {showPrintLabel && (
             <div className="form-group">
              <label>Etiqueta Contenedor</label>
              <input
                type="text"
                name="print_label"
                value={formData.print_label}
                onChange={handleChange}
                placeholder="Ingrese la etiqueta del contenedor..."
                //required
              />
              <small>Este campo es obligatorio cuando se selecciona "Retiro de contenedor"</small>
             </div>
             )}
{/* Nuevo campo debe estar oculto por default, a no ser que se seleccione en Detalles Retiro de tarima
y ademas es un array de hasta 4 codigos posibles*/}
  
             {showMultiLabel && (
             <div className="form-group">
              <label>Etiquetas de Tarima</label>
              <input
                type="text"
                name="multilabel"
                value={getMultiLabelDisplay()}
                onChange={handleMultiLabelChange}
                placeholder="Ingrese hasta 4 códigos..."
                //required
              />
             </div>
              )}

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
              <button
                type="submit"
                className="submit-button"
                disabled={isLoading} // 👈 ¡Crucial! Deshabilita el botón durante la petición.
              >
                {isLoading ? "Enviando..." : "Enviar Solicitud"}
              </button>
            </div>
          </form>
        </Modal>
        {/*<ChristmasCountdown />*/}
      </div>
    </RoleGate>
  );
}
