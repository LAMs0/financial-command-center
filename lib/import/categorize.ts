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
  // Inglés / EE. UU.
  /payroll|direct dep(osit)?|salary|paycheck|payment from|deposit from/,
  /interest (payment|earned|paid)|dividend|refund|reimbursement|rebate|cash back/,
  /\bzelle\b.*(from|received)|venmo.*(from|cashout)|irs.*(refund|treas)|tax ref/,
];

const TRANSFER_PATTERNS = [
  /transferencia|traspaso|spei/,
  /entre.*cuentas|pago.*tarjeta|abono.*tarjeta/,
  /codi|oxxo.*pay.*envio/,
  // Inglés / EE. UU.
  /\btransfer\b|online transfer|wire transfer|ach (transfer|debit|credit)/,
  /\bzelle\b|\bvenmo\b|\bcash app\b|paypal transfer|to savings|to checking/,
];

const CREDIT_CARD_PAYMENT_PATTERNS = [
  /pago.*tarjeta|pago tc|liquidacion.*tarjeta/,
  /pago.*credito|abono.*credito/,
  // Inglés / EE. UU.
  /(credit card|card) payment|payment.*thank you|autopay|online payment|epay/,
];

// ── Reglas de categoría ────────────────────────────────────────────────────

const CATEGORY_RULES: Array<{ pattern: RegExp; category: TransactionCategory }> = [
  // Salary / Income
  { pattern: /nomina|sueldo|salario|payroll|salary|paycheck|direct dep/, category: "salary" },

  // Food
  { pattern: /restaurante|restaurant|comida|taqueria|tacos|pizza|burger|sushi|cafe|starbucks|oxxo|seven|convenience|mercado|supermercado|frutas|verduras|carniceria/, category: "food" },
  { pattern: /uber.*eats|rappi|didi.*food|cornershop|ifood|doordash|grubhub|postmates|instacart/, category: "food" },
  { pattern: /walmart|soriana|chedraui|la comer|costco|sam.?s|heb|fresko|superama|kroger|safeway|trader joe|whole foods|publix|aldi|target|mcdonald|chipotle|wendy|taco bell|subway|dunkin|chick.?fil/, category: "food" },

  // Transport
  { pattern: /uber|didi|cabify|taxi|metro|metrobus|autobus|gasolina|pemex|bp|shell|repsol|estacion/, category: "transport" },
  { pattern: /tenencia|verificacion vehicular|seguro.*auto/, category: "transport" },
  { pattern: /\blyft\b|chevron|exxon|mobil|texaco|76 station|circle k|parking|toll|transit|amtrak|\bdmv\b/, category: "transport" },

  // Entertainment
  { pattern: /netflix|spotify|disney|hbo|amazon.*prime|apple.*tv|youtube|twitch|steam|playstation|xbox|hulu|max\.com|paramount|peacock|audible/, category: "entertainment" },
  { pattern: /cine|cinema|cinepolis|cinemex|teatro|concierto|amc theat|regal cinema|ticketmaster|stubhub/, category: "entertainment" },

  // Health
  { pattern: /farmacia|farmacias|benavides|del ahorro|similares|hospital|clinica|doctor|medico|laboratorio|optica|dentista|gym|gimnasio|sports/, category: "health" },
  { pattern: /cvs|walgreens|rite aid|pharmacy|urgent care|dental|clinic|\bdr\.?\b|medical|planet fitness|la fitness|equinox/, category: "health" },

  // Shopping
  { pattern: /amazon|mercado.*libre|liverpool|palacio.*hierro|suburbia|zara|h&m|sears|elektra|coppel/, category: "shopping" },
  { pattern: /compra.*comercio|pago.*comercio|purchase|best buy|home depot|lowe.?s|macy|nordstrom|ebay|etsy|nike|apple store|wal-mart|wm supercenter/, category: "shopping" },

  // Utilities
  { pattern: /cfe|comision.*federal|luz|electricidad/, category: "utilities" },
  { pattern: /gas.*natural|biogas|zgas|gas.*lp/, category: "utilities" },
  { pattern: /telmex|telcel|at&t|movistar|izzi|totalplay|megacable|infinitum|internet|telefono/, category: "utilities" },
  { pattern: /agua|sacmex|sapam|conagua/, category: "utilities" },
  { pattern: /verizon|t.?mobile|comcast|xfinity|spectrum|cox communic|pg&e|con ed|duke energy|electric co|water (dept|util)|utility/, category: "utilities" },

  // Housing
  { pattern: /renta|arrendamiento|alquiler|hipoteca|credito.*hipotecario|infonavit/, category: "housing" },
  { pattern: /mantenimiento|condominio|cuota.*vecinos|\brent\b|mortgage|apartment|property mgmt|\bhoa\b|landlord/, category: "housing" },

  // Education
  { pattern: /colegiatura|universidad|escuela|colegio|inscripcion|curso|udemy|coursera|platzi|tuition|university|college|student loan|sallie mae|navient/, category: "education" },

  // Travel
  { pattern: /aerolinea|aeromexico|volaris|vivaaerobus|american.*airlines|hotel|airbnb|booking|expedia|reservacion|delta air|united air|southwest|jetblue|marriott|hilton|hyatt|\btsa\b/, category: "travel" },

  // Investment
  { pattern: /inversion|gbm|fondo.*inversion|cetes|bursatil|robinhood|fidelity|vanguard|schwab|coinbase|e.?trade|brokerage|crypto/, category: "investment" },

  // Transfer
  { pattern: /transferencia|traspaso|spei|codi|\btransfer\b|\bzelle\b|\bvenmo\b|cash app|paypal/, category: "transfer" },
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
