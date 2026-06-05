type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

type ErrorInput = unknown;

function serializeError(error: ErrorInput) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    };
  }

  return { message: String(error) };
}

function write(level: LogLevel, event: string, context: LogContext = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    environment: process.env.NODE_ENV ?? "development",
    service: "financial-command-center",
    ...context,
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  debug: (event: string, context?: LogContext) => write("debug", event, context),
  info: (event: string, context?: LogContext) => write("info", event, context),
  warn: (event: string, context?: LogContext) => write("warn", event, context),
  error: (event: string, error: ErrorInput, context: LogContext = {}) =>
    write("error", event, { ...context, error: serializeError(error) }),
};

export async function notifyMonitoring(event: string, error: ErrorInput, context: LogContext = {}) {
  logger.error(event, error, context);

  const webhookUrl = process.env.ERROR_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event,
        context,
        error: serializeError(error),
        timestamp: new Date().toISOString(),
        service: "financial-command-center",
      }),
    });
  } catch (webhookError) {
    logger.warn("monitoring.webhook_failed", { error: serializeError(webhookError) });
  }
}
