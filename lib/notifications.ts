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

function severityOrder(severity: AppNotification["severity"]): number {
  return severity === "critical" ? 0 : severity === "warning" ? 1 : 2;
}

function budgetAlerts(budgets: Budget[]): AppNotification[] {
  const result: AppNotification[] = [];

  for (const budget of budgets) {
    const ratio = calculateBudgetRatio(budget);

    if (ratio >= 1.0) {
      result.push({
        id: `budget-critical-${budget.id}`,
        title: `${budget.label} rebasado`,
        message: `Has usado ${formatPercent(ratio)} del presupuesto de ${budget.label} este mes.`,
        severity: "critical",
        category: "budget",
        href: "/budget",
      });
    } else if (ratio >= 0.8) {
      result.push({
        id: `budget-warning-${budget.id}`,
        title: `${budget.label} casi lleno`,
        message: `${formatPercent(ratio)} del presupuesto de ${budget.label} usado. Vigila el ritmo de gasto.`,
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
    const utilization = calculateCardUtilization(card);

    if (utilization >= 0.7) {
      result.push({
        id: `card-critical-${card.id}`,
        title: `${card.name} con uso alto`,
        message: `Uso en ${formatPercent(utilization)}. Baja el saldo para proteger tu historial crediticio.`,
        severity: "critical",
        category: "card",
        href: "/cards",
      });
    } else if (utilization >= 0.3) {
      result.push({
        id: `card-warning-${card.id}`,
        title: `${card.name} subiendo uso`,
        message: `Uso de credito en ${formatPercent(utilization)}. Intenta mantenerlo debajo de 30%.`,
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
        title: `${goal.name} vencida`,
        message: `La meta vencio con ${formatPercent(progress)} de progreso. Ajusta la fecha o aumenta aportaciones.`,
        severity: "critical",
        category: "goal",
        href: "/goals",
      });
    } else if (daysLeft > 0 && daysLeft <= 90 && progress < 0.5) {
      result.push({
        id: `goal-warning-${goal.id}`,
        title: `${goal.name} atrasada`,
        message: `Quedan ${daysLeft} dias y solo llevas ${formatPercent(progress)}. Considera aumentar aportaciones.`,
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
  const lowBalanceThreshold = 1_000;

  for (const account of accounts) {
    if (account.type === "investment") continue;

    if (account.balance < lowBalanceThreshold) {
      result.push({
        id: `account-low-${account.id}`,
        title: `${account.name} con saldo bajo`,
        message: `Saldo actual: ${formatCurrency(account.balance, account.currency)}. Considera transferir fondos.`,
        severity: "warning",
        category: "account",
        href: "/accounts",
      });
    }
  }

  return result;
}
