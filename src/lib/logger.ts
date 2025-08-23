import winston from "winston";

const isDevelopment = process.env.NODE_ENV === "development";

// Configure log levels based on environment
const getLogLevel = () => {
  const env = process.env.NODE_ENV || "development";

  // In production, only log warnings and errors
  if (env === "production") {
    return "warn";
  }

  // In development, log everything including debug
  return "debug";
};

const logger = winston.createLogger({
  level: getLogLevel(),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "snaprate" },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),

    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// If we're not in production, log to the console as well
if (isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

export default logger;
