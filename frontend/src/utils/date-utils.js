/**
 * Utilitários para manipulação de datas no Grand Hotel.
 * Centraliza a lógica de formatação entre o frontend e a API (formato DD-MM-YYYY).
 */

/**
 * Converte data para o formato amigável brasileiro (DD/MM/YYYY)
 * @param {string|Date} d - Data bruta do backend ou objeto Date
 * @returns {string} - Data formatada ou placeholder
 */
export function formatDate(d) {
  if (!d) return "—";
  try {
    // Se já estiver no formato DD-MM-YYYY ou similar
    if (typeof d === "string" && d.includes("-") && d.split("-")[0].length === 2) {
      const parts = d.split("-");
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    
    const date = typeof d === "string" ? (d.includes(" ") ? new Date(d.split(" ")[0]) : new Date(d)) : d;
    if (isNaN(date.getTime())) return "—";
    
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "—";
  }
}

/**
 * Converte data para o formato de input HTML (YYYY-MM-DD)
 * @param {string|Date} d - Data do backend ou objeto Date
 * @returns {string} - Data compatível com <input type="date">
 */
export function toInputDate(d) {
  if (!d) return "";
  try {
    // Se vier do backend como DD-MM-YYYY
    if (typeof d === "string" && d.includes("-") && d.split("-")[0].length === 2) {
      const [day, m, year] = d.split("-");
      return `${year}-${m}-${day}`;
    }
    
    const date = typeof d === "string" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

/**
 * Converte data para o formato esperado pelo backend (DD-MM-YYYY)
 * @param {string|Date} value - Data vinda de um input ou objeto Date
 * @returns {string} - Data formatada para a API
 */
export function toBackendDate(value) {
  if (!value) return "";
  try {
    // Se for string de input (YYYY-MM-DD)
    if (typeof value === "string" && value.includes("-") && value.split("-")[0].length === 4) {
      const [year, month, day] = value.split("-");
      return `${day}-${month}-${year}`;
    }
    
    const d = typeof value === "string" ? new Date(value + "T12:00:00") : value;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return "";
  }
}
