import type {
  Account,
  AppNotification,
  Budget,
  CreditCard,
  Goal,
} from "@/types/finance";
import {
  calculateBudgetRatio,
  calculateCardUtilization,
  calculateGoalProgress,
} from "./calculations";
import { formatCurrency, formatPercent } from "./formatters";

/*
  notifications.ts — Lógica de alertas financieras derivadas
  ───────────────────────────────────────────────────────────
  Funciones puras: toman datos del dominio y devuelven notificaciones.
  No tocan la DB ni el estado — fácil de testear y predecible.

  Umbrales de referencia:
  - Budget:  ≥ 80% → warning  |  ≥ 100% → critical
  - Tarjeta: ≥ 30% → warning  |  ≥ 70%  → critical
  - Meta:    < 50% progreso con ≤ 90 días → warning | vencida → critical
  - Cuenta:  saldo < 1 000 MXN (non-investment) → warning
*/

export interface NotificationInput {
  budgets: Budget[];
  cards: CreditCard[];
  goals: Goal[];
  accounts: Account[];
}

export function generateNotifications(data: NotificationInput): AppNotification[] {
  return [
    ...budgetAlerts(data.budgets),
    ...cardAlerts(data.cards),
    ...goalAlerts(data.goals),
    ...accountAlerts(data.accounts),
  ].sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));
}

function severityOrder(s: AppNotification["severity"]): number {
  return s === "critical" ? 0 : s === "warning" ? 1 : 2;
}

function budgetAlerts(budgets: Budget[]): AppNotification[] {
  const result: AppNotification[] = [];

  for (const budget of budgets) {
    const ratio = calculateBudgetRatio(budget);

    if (ratio >= 1.0) {
      result.push({
        id: `budget-critical-${budget.id}`,
        title: `${budget.label} over budget`,
        message: `Spent ${formatPercent(ratio)} of your ${budget.label} budget this month.`,
        severity: "critical",
        category: "budget",
        href: "/budget",
      });
    } else if (ratio >= 0.8) {
      result.push({
        id: `budget-warning-${budget.id}`,
        title: `${budget.label} almost full`,
        message: `${formatPercent(ratio)} of your ${budget.label} budget used — watch your spending.`,
        severity: "warning",
        category: "budget",
        href: "/budget",
      });
    }
  }

  return result;
}

function cardAlerts(cards: CreditCard[]): AppNotification[] {
  const result: AppNotification[] = [];

  for (const card of cards) {
    const util = calculateCardUtilization(card);

    if (util >= 0.7) {
      result.push({
        id: `card-critical-${card.id}`,
        title: `${card.name} high utilization`,
        message: `Utilization at ${formatPercent(util)} — pay down balance to protect your credit score.`,
        severity: "critical",
        category: "card",
        href: "/cards",
      });
    } else if (util >= 0.3) {
      result.push({
        id: `card-warning-${card.id}`,
        title: `${card.name} utilization rising`,
        message: `Credit utilization at ${formatPercent(util)} — aim to keep it under 30%.`,
        severity: "warning",
        category: "card",
        href: "/cards",
      });
    }
  }

  return result;
}

function goalAlerts(goals: Goal[]): AppNotification[] {
  const result: AppNotification[] = [];
  const today = new Date();

  for (const goal of goals) {
    const progress = calculateGoalProgress(goal.currentAmount, goal.targetAmount);
    const daysLeft = Math.ceil(
      (new Date(goal.targetDate).getTime() - today.getTime()) / 86_400_000
    );

    if (daysLeft <= 0 && progress < 1) {
      result.push({
        id: `goal-overdue-${goal.id}`,
        title: `${goal.name} past deadline`,
        message: `Goal deadline passed at ${formatPercent(progress)} progress. Update your target date or boost contributions.`,
        severity: "critical",
        category: "goal",
        href: "/goals",
      });
    } else if (daysLeft > 0 && daysLeft <= 90 && progress < 0.5) {
      result.push({
        id: `goal-warning-${goal.id}`,
        title: `${goal.name} behind schedule`,
        message: `${daysLeft} days left and only ${formatPercent(progress)} achieved. Consider increasing contributions.`,
        severity: "warning",
        category: "goal",
        href: "/goals",
      });
    }
  }

  return result;
}

function accountAlerts(accounts: Account[]): AppNotification[] {
  const result: AppNotification[] = [];
  const LOW_BALANCE_THRESHOLD = 1_000;

  for (const account of accounts) {
    if (account.type === "investment") continue;

    if (account.balance < LOW_BALANCE_THRESHOLD) {
      result.push({
        id: `account-low-${account.id}`,
        title: `${account.name} low balance`,
        message: `Balance is ${formatCurrency(account.balance, account.currency)} — consider a transfer to avoid overdraft.`,
        severity: "warning",
        category: "account",
        href: "/accounts",
      });
    }
  }

  return result;
}
