import type { TransactionCategory, TransactionType } from "@/types/finance";

/*
  categorize.ts — Inferencia automática de categoría y tipo de transacción
  ─────────────────────────────────────────────────────────────────────────
  Aplica reglas de keywords sobre la descripción del movimiento.
  Prioridad: primero el tipo (income/expense/transfer), luego la categoría.

  Las reglas se aplican en orden — la primera que hace match gana.
  Los patrones son case-insensitive y normalizados (sin acentos).
*/

// Normaliza: minúsculas + quita acentos
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// ── Reglas de tipo ─────────────────────────────────────────────────────────

const INCOME_PATTERNS = [
  /nomina|nomina|sueldo|salario|pago.*empresa|deposito.*empresa/,
  /transferencia.*recibida|abono.*transferencia/,
  /interes.*generado|rendimiento|premio/,
  /devolucion|reembolso|cashback/,
  /venta|cobro|ingreso/,
];

const TRANSFER_PATTERNS = [
  /transferencia|traspaso|spei/,
  /entre.*cuentas|pago.*tarjeta|abono.*tarjeta/,
  /codi|oxxo.*pay.*envio/,
];

const CREDIT_CARD_PAYMENT_PATTERNS = [
  /pago.*tarjeta|pago tc|liquidacion.*tarjeta/,
  /pago.*credito|abono.*credito/,
];

// ── Reglas de categoría ────────────────────────────────────────────────────

const CATEGORY_RULES: Array<{ pattern: RegExp; category: TransactionCategory }> = [
  // Salary / Income
  { pattern: /nomina|sueldo|salario/, category: "salary" },

  // Food
  { pattern: /restaurante|restaurant|comida|taqueria|tacos|pizza|burger|sushi|cafe|starbucks|oxxo|seven|convenience|mercado|supermercado|frutas|verduras|carniceria/, category: "food" },
  { pattern: /uber.*eats|rappi|didi.*food|cornershop|ifood/, category: "food" },
  { pattern: /walmart|soriana|chedraui|la comer|costco|sam.?s|heb|fresko|superama/, category: "food" },

  // Transport
  { pattern: /uber|didi|cabify|taxi|metro|metrobus|autobus|gasolina|pemex|bp|shell|repsol|estacion/, category: "transport" },
  { pattern: /tenencia|verificacion vehicular|seguro.*auto/, category: "transport" },

  // Entertainment
  { pattern: /netflix|spotify|disney|hbo|amazon.*prime|apple.*tv|youtube|twitch|steam|playstation|xbox/, category: "entertainment" },
  { pattern: /cine|cinema|cinepolis|cinemex|teatro|concierto/, category: "entertainment" },

  // Health
  { pattern: /farmacia|farmacias|benavides|del ahorro|similares|hospital|clinica|doctor|medico|laboratorio|optica|dentista|gym|gimnasio|sports/, category: "health" },

  // Shopping
  { pattern: /amazon|mercado.*libre|liverpool|palacio.*hierro|suburbia|zara|h&m|sears|elektra|coppel/, category: "shopping" },
  { pattern: /compra.*comercio|pago.*comercio|purchase/, category: "shopping" },

  // Utilities
  { pattern: /cfe|comision.*federal|luz|electricidad/, category: "utilities" },
  { pattern: /gas.*natural|biogas|zgas|gas.*lp/, category: "utilities" },
  { pattern: /telmex|telcel|at&t|movistar|izzi|totalplay|megacable|infinitum|internet|telefono/, category: "utilities" },
  { pattern: /agua|sacmex|sapam|conagua/, category: "utilities" },

  // Housing
  { pattern: /renta|arrendamiento|alquiler|hipoteca|credito.*hipotecario|infonavit/, category: "housing" },
  { pattern: /mantenimiento|condominio|cuota.*vecinos/, category: "housing" },

  // Education
  { pattern: /colegiatura|universidad|escuela|colegio|inscripcion|curso|udemy|coursera|platzi/, category: "education" },

  // Travel
  { pattern: /aerolinea|aeromexico|volaris|vivaaerobus|american.*airlines|hotel|airbnb|booking|expedia|reservacion/, category: "travel" },

  // Investment
  { pattern: /inversion|gbm|fondo.*inversion|cetes|bursatil/, category: "investment" },

  // Transfer
  { pattern: /transferencia|traspaso|spei|codi/, category: "transfer" },
];

export function inferType(
  description: string,
  amount: number,
  isCredit: boolean   // ¿el movimiento es un abono (credit) en la cuenta?
): TransactionType {
  const desc = normalize(description);

  // Pagos de tarjeta de crédito = transfer (salida de una cuenta, abono a otra)
  if (CREDIT_CARD_PAYMENT_PATTERNS.some((p) => p.test(desc))) return "transfer";

  // Transferencias entre cuentas
  if (TRANSFER_PATTERNS.some((p) => p.test(desc))) return "transfer";

  // Ingresos explícitos
  if (isCredit && INCOME_PATTERNS.some((p) => p.test(desc))) return "income";

  // Si es abono y no es un pago, lo marcamos como income por defecto
  if (isCredit) return "income";

  return "expense";
}

export function inferCategory(description: string, type: TransactionType): TransactionCategory {
  if (type === "transfer") return "transfer";

  const desc = normalize(description);

  for (const { pattern, category } of CATEGORY_RULES) {
    if (pattern.test(desc)) return category;
  }

  return "other";
}
