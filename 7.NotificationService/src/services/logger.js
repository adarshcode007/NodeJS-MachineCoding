function serializeDetails(details) {
  if (details === undefined) {
    return undefined;
  }

  if (details instanceof Error) {
    return {
      name: details.name,
      message: details.message,
      stack: details.stack,
    };
  }

  if (typeof details === "object" && details !== null) {
    return details;
  }

  return {
    value: details,
  };
}

class Logger {
  log(level, message, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    const serializedDetails = serializeDetails(details);

    if (serializedDetails !== undefined) {
      entry.details = serializedDetails;
    }

    console.log(JSON.stringify(entry));

    return entry;
  }

  info(message, details) {
    return this.log("info", message, details);
  }

  warn(message, details) {
    return this.log("warn", message, details);
  }

  error(message, details) {
    return this.log("error", message, details);
  }

  debug(message, details) {
    return this.log("debug", message, details);
  }
}

const logger = new Logger();

export default logger;
