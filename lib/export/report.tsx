/*
  report.tsx — Plantilla de reporte PDF mensual
  ────────────────────────────────────────────────
  Usa @react-pdf/renderer: componentes de React que se renderizan
  a PDF en el servidor (no en el browser). La API es similar a HTML
  pero con un subconjunto limitado de propiedades CSS (Flexbox + básicos).

  IMPORTANTE: Este archivo NO usa "use client". Se ejecuta solo en Node.js
  dentro del Route Handler de /api/export/report.
*/

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Account, Budget, CreditCard, Goal, MonthlySnapshot, Transaction } from "@/types/finance";

// ── Fuentes ────────────────────────────────────────────────────────────────
// react-pdf usa fuentes embebidas — necesitamos registrar las que queremos usar.
// Para mantener cero dependencias externas usamos Helvetica (built-in de PDF spec).

// Estilos globales del reporte
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
    backgroundColor: "#ffffff",
    paddingHorizontal: 40,
    paddingVertical: 36,
  },

  // ── Header ─────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerLogo: {
    width: 32,
    height: 32,
    backgroundColor: "#10b981",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerLogoText: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  headerSubtitle: { fontSize: 9, color: "#64748b", marginTop: 2 },
  headerMeta: { alignItems: "flex-end" },
  headerMetaLabel: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase" },
  headerMetaValue: { fontSize: 10, color: "#0f172a", fontFamily: "Helvetica-Bold", marginTop: 2 },

  // ── Secciones ──────────────────────────────────────────────────────
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  // ── Cards de stat ──────────────────────────────────────────────────
  statGrid: { flexDirection: "row", gap: 8, marginBottom: 0 },
  statCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statLabel: { fontSize: 7, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#0f172a", marginTop: 4 },
  statDetail: { fontSize: 7.5, color: "#94a3b8", marginTop: 2 },
  statValuePositive: { color: "#10b981" },
  statValueNegative: { color: "#ef4444" },

  // ── Tabla genérica ─────────────────────────────────────────────────
  table: { width: "100%" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableRowAlt: { backgroundColor: "#fafafa" },
  thCell: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#475569", textTransform: "uppercase" },
  tdCell: { fontSize: 8, color: "#334155" },

  // ── Barra de progreso ──────────────────────────────────────────────
  progressTrack: { height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, marginTop: 3 },
  progressFill: { height: 4, borderRadius: 2 },

  // ── Chip de severidad ──────────────────────────────────────────────
  chipOk:       { backgroundColor: "#dcfce7", color: "#16a34a", borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1, fontSize: 7 },
  chipWarn:     { backgroundColor: "#fef3c7", color: "#d97706", borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1, fontSize: 7 },
  chipCritical: { backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1, fontSize: 7 },

  // ── Footer ─────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  footerText: { fontSize: 7.5, color: "#94a3b8" },
});

// ── Helpers de formato (sin Intl — react-pdf corre en un entorno limitado) ──
function fmt(amount: number, currency = "MXN"): string {
  const symbol = currency === "USD" ? "US$" : currency === "EUR" ? "€" : "$";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  const formatted = abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${symbol}${formatted}`;
}

function pct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface ReportData {
  generatedAt: string;       // ISO datetime string
  period: string;            // "Mayo 2025"
  accounts: Account[];
  cards: CreditCard[];
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  monthlyHistory: MonthlySnapshot[];
}

// ── Componentes internos ───────────────────────────────────────────────────

function ReportHeader({ period, generatedAt }: { period: string; generatedAt: string }) {
  const dateStr = generatedAt.split("T")[0];
  return (
    <View style={s.header}>
      <View style={s.headerTitleRow}>
        <View style={s.headerLogo}>
          <Text style={s.headerLogoText}>FC</Text>
        </View>
        <View>
          <Text style={s.headerTitle}>Financial Command Center</Text>
          <Text style={s.headerSubtitle}>Monthly Financial Report · {period}</Text>
        </View>
      </View>
      <View style={s.headerMeta}>
        <Text style={s.headerMetaLabel}>Generated</Text>
        <Text style={s.headerMetaValue}>{dateStr}</Text>
      </View>
    </View>
  );
}

function NetWorthSection({ accounts, cards, transactions }: Pick<ReportData, "accounts" | "cards" | "transactions">) {
  const bankAssets = accounts.reduce((s, a) => s + a.balance, 0);
  const liabilities = cards.reduce((s, c) => s + c.balance, 0);
  const netWorth = bankAssets - liabilities;
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savingsRate = income > 0 ? (income - expenses) / income : 0;

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Financial Overview</Text>
      <View style={s.statGrid}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Net Worth</Text>
          <Text style={[s.statValue, netWorth >= 0 ? s.statValuePositive : s.statValueNegative]}>
            {fmt(netWorth)}
          </Text>
          <Text style={s.statDetail}>Assets minus liabilities</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Total Assets</Text>
          <Text style={[s.statValue, s.statValuePositive]}>{fmt(bankAssets)}</Text>
          <Text style={s.statDetail}>{accounts.length} accounts</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Total Liabilities</Text>
          <Text style={[s.statValue, s.statValueNegative]}>{fmt(liabilities)}</Text>
          <Text style={s.statDetail}>{cards.length} credit cards</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Savings Rate</Text>
          <Text style={[s.statValue, savingsRate >= 0 ? s.statValuePositive : s.statValueNegative]}>
            {pct(savingsRate)}
          </Text>
          <Text style={s.statDetail}>Income − expenses / income</Text>
        </View>
      </View>
    </View>
  );
}

function AccountsSection({ accounts }: { accounts: Account[] }) {
  const colW = [0.35, 0.25, 0.2, 0.2];
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Accounts</Text>
      <View style={s.table}>
        <View style={s.tableHeader}>
          {["Account", "Institution", "Type", "Balance"].map((h, i) => (
            <Text key={h} style={[s.thCell, { flex: colW[i] }]}>{h}</Text>
          ))}
        </View>
        {accounts.map((a, idx) => (
          <View key={a.id} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
            <Text style={[s.tdCell, { flex: colW[0] }]}>{a.name}</Text>
            <Text style={[s.tdCell, { flex: colW[1] }]}>{a.institution}</Text>
            <Text style={[s.tdCell, { flex: colW[2], textTransform: "capitalize" }]}>{a.type}</Text>
            <Text style={[s.tdCell, { flex: colW[3], textAlign: "right" }]}>{fmt(a.balance, a.currency)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CardsSection({ cards }: { cards: CreditCard[] }) {
  const colW = [0.3, 0.15, 0.15, 0.15, 0.25];
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Credit Cards</Text>
      <View style={s.table}>
        <View style={s.tableHeader}>
          {["Card", "Balance", "Limit", "Utilization", "Status"].map((h, i) => (
            <Text key={h} style={[s.thCell, { flex: colW[i] }]}>{h}</Text>
          ))}
        </View>
        {cards.map((c, idx) => {
          const util = c.limit > 0 ? c.balance / c.limit : 0;
          const chipStyle = util >= 0.7 ? s.chipCritical : util >= 0.3 ? s.chipWarn : s.chipOk;
          const chipLabel = util >= 0.7 ? "High" : util >= 0.3 ? "Moderate" : "Healthy";

          return (
            <View key={c.id} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tdCell, { flex: colW[0] }]}>{c.name} ···{c.lastFourDigits}</Text>
              <Text style={[s.tdCell, { flex: colW[1], textAlign: "right" }]}>{fmt(c.balance, c.currency)}</Text>
              <Text style={[s.tdCell, { flex: colW[2], textAlign: "right" }]}>{fmt(c.limit, c.currency)}</Text>
              <View style={{ flex: colW[3] }}>
                <Text style={s.tdCell}>{pct(util)}</Text>
                <View style={s.progressTrack}>
                  <View style={[
                    s.progressFill,
                    {
                      width: `${Math.min(util * 100, 100)}%`,
                      backgroundColor: util >= 0.7 ? "#ef4444" : util >= 0.3 ? "#f59e0b" : "#10b981",
                    }
                  ]} />
                </View>
              </View>
              <View style={{ flex: colW[4], alignItems: "flex-start" }}>
                <Text style={chipStyle}>{chipLabel}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function BudgetSection({ budgets }: { budgets: Budget[] }) {
  const colW = [0.3, 0.2, 0.2, 0.15, 0.15];
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Budget</Text>
      <View style={s.table}>
        <View style={s.tableHeader}>
          {["Category", "Allocated", "Spent", "Remaining", "Usage"].map((h, i) => (
            <Text key={h} style={[s.thCell, { flex: colW[i] }]}>{h}</Text>
          ))}
        </View>
        {budgets.map((b, idx) => {
          const ratio = b.allocated > 0 ? b.spent / b.allocated : 0;
          const remaining = b.allocated - b.spent;

          return (
            <View key={b.id} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tdCell, { flex: colW[0] }]}>{b.label}</Text>
              <Text style={[s.tdCell, { flex: colW[1], textAlign: "right" }]}>{fmt(b.allocated, b.currency)}</Text>
              <Text style={[s.tdCell, { flex: colW[2], textAlign: "right" }]}>{fmt(b.spent, b.currency)}</Text>
              <Text style={[s.tdCell, { flex: colW[3], textAlign: "right", color: remaining < 0 ? "#ef4444" : "#334155" }]}>
                {fmt(remaining, b.currency)}
              </Text>
              <View style={{ flex: colW[4] }}>
                <Text style={[s.tdCell, { color: ratio >= 1 ? "#ef4444" : ratio >= 0.8 ? "#d97706" : "#334155" }]}>
                  {pct(ratio)}
                </Text>
                <View style={s.progressTrack}>
                  <View style={[
                    s.progressFill,
                    {
                      width: `${Math.min(ratio * 100, 100)}%`,
                      backgroundColor: ratio >= 1 ? "#ef4444" : ratio >= 0.8 ? "#f59e0b" : "#10b981",
                    }
                  ]} />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function GoalsSection({ goals }: { goals: Goal[] }) {
  const colW = [0.3, 0.2, 0.2, 0.15, 0.15];
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Financial Goals</Text>
      <View style={s.table}>
        <View style={s.tableHeader}>
          {["Goal", "Target", "Saved", "Progress", "Target Date"].map((h, i) => (
            <Text key={h} style={[s.thCell, { flex: colW[i] }]}>{h}</Text>
          ))}
        </View>
        {goals.map((g, idx) => {
          const progress = g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0;

          return (
            <View key={g.id} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tdCell, { flex: colW[0] }]}>{g.icon} {g.name}</Text>
              <Text style={[s.tdCell, { flex: colW[1], textAlign: "right" }]}>{fmt(g.targetAmount, g.currency)}</Text>
              <Text style={[s.tdCell, { flex: colW[2], textAlign: "right" }]}>{fmt(g.currentAmount, g.currency)}</Text>
              <View style={{ flex: colW[3] }}>
                <Text style={s.tdCell}>{pct(progress)}</Text>
                <View style={s.progressTrack}>
                  <View style={[s.progressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: "#10b981" }]} />
                </View>
              </View>
              <Text style={[s.tdCell, { flex: colW[4] }]}>{g.targetDate}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function TransactionsSummarySection({ transactions }: { transactions: Transaction[] }) {
  // Top 10 más recientes
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const colW = [0.2, 0.35, 0.15, 0.15, 0.15];

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Recent Transactions (last 10)</Text>
      <View style={s.table}>
        <View style={s.tableHeader}>
          {["Date", "Description", "Type", "Category", "Amount"].map((h, i) => (
            <Text key={h} style={[s.thCell, { flex: colW[i] }]}>{h}</Text>
          ))}
        </View>
        {recent.map((t, idx) => (
          <View key={t.id} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
            <Text style={[s.tdCell, { flex: colW[0] }]}>{t.date}</Text>
            <Text style={[s.tdCell, { flex: colW[1] }]}>
              {t.description.length > 28 ? t.description.slice(0, 26) + "…" : t.description}
            </Text>
            <Text style={[s.tdCell, { flex: colW[2], textTransform: "capitalize" }]}>{t.type}</Text>
            <Text style={[s.tdCell, { flex: colW[3], textTransform: "capitalize" }]}>{t.category}</Text>
            <Text style={[
              s.tdCell,
              { flex: colW[4], textAlign: "right", color: t.type === "income" ? "#10b981" : t.type === "expense" ? "#ef4444" : "#64748b" }
            ]}>
              {t.type === "expense" ? "-" : "+"}{fmt(t.amount, t.currency)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReportFooter({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Financial Command Center — Confidential</Text>
      <Text style={s.footerText}>Generated {generatedAt.split("T")[0]}</Text>
    </View>
  );
}

// ── Documento raíz ─────────────────────────────────────────────────────────

export function FinancialReport({ data }: { data: ReportData }) {
  return (
    <Document
      title={`Financial Report — ${data.period}`}
      author="Financial Command Center"
      creator="Financial Command Center"
    >
      {/* Página 1: Overview + Accounts + Cards */}
      <Page size="A4" style={s.page}>
        <ReportHeader period={data.period} generatedAt={data.generatedAt} />
        <NetWorthSection accounts={data.accounts} cards={data.cards} transactions={data.transactions} />
        <AccountsSection accounts={data.accounts} />
        <CardsSection cards={data.cards} />
        <ReportFooter generatedAt={data.generatedAt} />
      </Page>

      {/* Página 2: Budget + Goals + Transactions */}
      <Page size="A4" style={s.page}>
        <ReportHeader period={data.period} generatedAt={data.generatedAt} />
        <BudgetSection budgets={data.budgets} />
        <GoalsSection goals={data.goals} />
        <TransactionsSummarySection transactions={data.transactions} />
        <ReportFooter generatedAt={data.generatedAt} />
      </Page>
    </Document>
  );
}
