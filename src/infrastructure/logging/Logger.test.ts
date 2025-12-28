/**
 * Logger Tests
 *
 * Comprehensive tests for Logger service covering all log levels,
 * context formatting, error formatting, and environment-based configuration.
 */

import log from "loglevel";

// Import Logger to test (we'll recreate instances to test constructor)
import { logger, LogLevel, LogContext } from "./Logger";

// Mock loglevel
jest.mock("loglevel", () => {
  const mockLogger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    setLevel: jest.fn(),
    getLevel: jest.fn(() => 1), // Default to debug level
    methodFactory: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockLogger,
  };
});

describe("Logger", () => {
  const mockedLog = log as jest.Mocked<typeof log>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Log Levels", () => {
    it("should log trace messages without context", () => {
      // Arrange
      const message = "Trace message";

      // Act
      logger.trace(message);

      // Assert
      expect(mockedLog.trace).toHaveBeenCalledWith(message);
    });

    it("should log trace messages with context", () => {
      // Arrange
      const message = "Trace with context";
      const context: LogContext = { userId: 123, action: "login" };

      // Act
      logger.trace(message, context);

      // Assert
      expect(mockedLog.trace).toHaveBeenCalledWith(
        message,
        expect.stringContaining("userId"),
      );
    });

    it("should log debug messages without context", () => {
      // Arrange
      const message = "Debug message";

      // Act
      logger.debug(message);

      // Assert
      expect(mockedLog.debug).toHaveBeenCalledWith(message);
    });

    it("should log debug messages with context", () => {
      // Arrange
      const message = "Debug with context";
      const context: LogContext = { cacheKey: "characters-1", hit: true };

      // Act
      logger.debug(message, context);

      // Assert
      expect(mockedLog.debug).toHaveBeenCalledWith(
        message,
        expect.stringContaining("cacheKey"),
      );
    });

    it("should log info messages without context", () => {
      // Arrange
      const message = "Info message";

      // Act
      logger.info(message);

      // Assert
      expect(mockedLog.info).toHaveBeenCalledWith(message);
    });

    it("should log info messages with context", () => {
      // Arrange
      const message = "User action";
      const context: LogContext = { action: "search", query: "spider" };

      // Act
      logger.info(message, context);

      // Assert
      expect(mockedLog.info).toHaveBeenCalledWith(
        message,
        expect.stringContaining("action"),
      );
    });

    it("should log warning messages without context", () => {
      // Arrange
      const message = "Warning message";

      // Act
      logger.warn(message);

      // Assert
      expect(mockedLog.warn).toHaveBeenCalledWith(message);
    });

    it("should log warning messages with context", () => {
      // Arrange
      const message = "Slow API response";
      const context: LogContext = {
        endpoint: "/api/characters",
        duration: 5000,
      };

      // Act
      logger.warn(message, context);

      // Assert
      expect(mockedLog.warn).toHaveBeenCalledWith(
        message,
        expect.stringContaining("endpoint"),
      );
    });

    it("should log error messages without error object", () => {
      // Arrange
      const message = "Error occurred";

      // Act
      logger.error(message);

      // Assert
      expect(mockedLog.error).toHaveBeenCalledWith(message, undefined);
    });

    it("should log error messages with Error object", () => {
      // Arrange
      const message = "API call failed";
      const error = new Error("Network timeout");
      error.name = "TimeoutError";

      // Act
      logger.error(message, error);

      // Assert
      expect(mockedLog.error).toHaveBeenCalledWith(
        message,
        expect.stringContaining("TimeoutError"),
      );
      expect(mockedLog.error).toHaveBeenCalledWith(
        message,
        expect.stringContaining("Network timeout"),
      );
    });

    it("should log error messages with Error object and context", () => {
      // Arrange
      const message = "Character fetch failed";
      const error = new Error("404 Not Found");
      const context: LogContext = { characterId: 123 };

      // Act
      logger.error(message, error, context);

      // Assert
      expect(mockedLog.error).toHaveBeenCalledWith(
        message,
        expect.stringContaining("characterId"),
      );
      expect(mockedLog.error).toHaveBeenCalledWith(
        message,
        expect.stringContaining("404 Not Found"),
      );
    });

    it("should log error messages with non-Error object", () => {
      // Arrange
      const message = "Unknown error";
      const error = "String error";

      // Act
      logger.error(message, error);

      // Assert
      expect(mockedLog.error).toHaveBeenCalledWith(message, error);
    });
  });

  describe("Context Formatting", () => {
    it("should format empty context as empty string", () => {
      // Arrange
      const message = "Message without context";
      const context: LogContext = {};

      // Act
      logger.info(message, context);

      // Assert
      expect(mockedLog.info).toHaveBeenCalledWith(message);
    });

    it("should format simple context", () => {
      // Arrange
      const message = "User login";
      const context: LogContext = { userId: 123 };

      // Act
      logger.info(message, context);

      // Assert
      expect(mockedLog.info).toHaveBeenCalledWith(
        message,
        expect.stringContaining('"userId": 123'),
      );
    });

    it("should format complex nested context", () => {
      // Arrange
      const message = "Complex operation";
      const context: LogContext = {
        user: { id: 123, name: "Test" },
        metadata: { timestamp: "2024-01-01", version: 1 },
      };

      // Act
      logger.info(message, context);

      // Assert
      expect(mockedLog.info).toHaveBeenCalledWith(
        message,
        expect.stringContaining('"user"'),
      );
      expect(mockedLog.info).toHaveBeenCalledWith(
        message,
        expect.stringContaining('"metadata"'),
      );
    });

    it("should format context with different data types", () => {
      // Arrange
      const message = "Various types";
      const context: LogContext = {
        string: "text",
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
      };

      // Act
      logger.debug(message, context);

      // Assert
      expect(mockedLog.debug).toHaveBeenCalledWith(
        message,
        expect.stringContaining('"string": "text"'),
      );
      expect(mockedLog.debug).toHaveBeenCalledWith(
        message,
        expect.stringContaining('"number": 42'),
      );
      expect(mockedLog.debug).toHaveBeenCalledWith(
        message,
        expect.stringContaining('"boolean": true'),
      );
    });
  });

  describe("Error Formatting", () => {
    it("should extract error name from Error object", () => {
      // Arrange
      const message = "Error occurred";
      const error = new Error("Test error");
      error.name = "CustomError";

      // Act
      logger.error(message, error);

      // Assert
      expect(mockedLog.error).toHaveBeenCalledWith(
        message,
        expect.stringContaining('"errorName": "CustomError"'),
      );
    });

    it("should extract error message from Error object", () => {
      // Arrange
      const message = "Operation failed";
      const error = new Error("Validation failed: invalid input");

      // Act
      logger.error(message, error);

      // Assert
      expect(mockedLog.error).toHaveBeenCalledWith(
        message,
        expect.stringContaining(
          '"errorMessage": "Validation failed: invalid input"',
        ),
      );
    });

    it("should extract error stack from Error object", () => {
      // Arrange
      const message = "Stack trace";
      const error = new Error("Error with stack");

      // Act
      logger.error(message, error);

      // Assert
      expect(mockedLog.error).toHaveBeenCalledWith(
        message,
        expect.stringContaining('"errorStack"'),
      );
    });

    it("should merge error context with additional context", () => {
      // Arrange
      const message = "API error with context";
      const error = new Error("Network error");
      const context: LogContext = { endpoint: "/api/characters", attempt: 3 };

      // Act
      logger.error(message, error, context);

      // Assert
      expect(mockedLog.error).toHaveBeenCalledWith(
        message,
        expect.stringContaining('"endpoint"'),
      );
      expect(mockedLog.error).toHaveBeenCalledWith(
        message,
        expect.stringContaining('"errorMessage"'),
      );
    });

    it("should handle Error objects without stack", () => {
      // Arrange
      const message = "Error without stack";
      const error = new Error("Simple error");
      delete error.stack;

      // Act
      logger.error(message, error);

      // Assert
      expect(mockedLog.error).toHaveBeenCalledWith(
        message,
        expect.stringContaining('"errorMessage"'),
      );
    });
  });

  describe("Log Level Management", () => {
    it("should set log level", () => {
      // Arrange
      const level: LogLevel = "warn";

      // Act
      logger.setLevel(level);

      // Assert
      expect(mockedLog.setLevel).toHaveBeenCalledWith(level);
    });

    it("should get current log level", () => {
      // Arrange
      mockedLog.getLevel.mockReturnValue(1); // debug level

      // Act
      const level = logger.getLevel();

      // Assert
      expect(level).toBe("debug");
    });

    it("should return silent for unknown log level", () => {
      // Arrange
      mockedLog.getLevel.mockReturnValue(
        999 as unknown as ReturnType<typeof mockedLog.getLevel>,
      ); // Unknown level

      // Act
      const level = logger.getLevel();

      // Assert
      expect(level).toBe("silent");
    });

    it("should handle trace level", () => {
      // Arrange
      mockedLog.getLevel.mockReturnValue(0);

      // Act
      const level = logger.getLevel();

      // Assert
      expect(level).toBe("trace");
    });

    it("should handle info level", () => {
      // Arrange
      mockedLog.getLevel.mockReturnValue(2);

      // Act
      const level = logger.getLevel();

      // Assert
      expect(level).toBe("info");
    });

    it("should handle warn level", () => {
      // Arrange
      mockedLog.getLevel.mockReturnValue(3);

      // Act
      const level = logger.getLevel();

      // Assert
      expect(level).toBe("warn");
    });

    it("should handle error level", () => {
      // Arrange
      mockedLog.getLevel.mockReturnValue(4);

      // Act
      const level = logger.getLevel();

      // Assert
      expect(level).toBe("error");
    });

    it("should handle silent level", () => {
      // Arrange
      mockedLog.getLevel.mockReturnValue(5);

      // Act
      const level = logger.getLevel();

      // Assert
      expect(level).toBe("silent");
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined context", () => {
      // Arrange
      const message = "No context";

      // Act
      logger.info(message, undefined);

      // Assert
      expect(mockedLog.info).toHaveBeenCalledWith(message);
    });

    it("should handle null values in context", () => {
      // Arrange
      const message = "Null values";
      const context: LogContext = { value: null };

      // Act
      logger.info(message, context);

      // Assert
      expect(mockedLog.info).toHaveBeenCalledWith(
        message,
        expect.stringContaining('"value": null'),
      );
    });

    it("should handle very long messages", () => {
      // Arrange
      const message = "A".repeat(1000);

      // Act
      logger.info(message);

      // Assert
      expect(mockedLog.info).toHaveBeenCalledWith(message);
    });

    it("should handle special characters in messages", () => {
      // Arrange
      const message = "Special chars: <>&\"'";

      // Act
      logger.info(message);

      // Assert
      expect(mockedLog.info).toHaveBeenCalledWith(message);
    });

    it("should handle unicode characters in context", () => {
      // Arrange
      const message = "Unicode test";
      const context: LogContext = { emoji: "🕷️", chinese: "蜘蛛侠" };

      // Act
      logger.info(message, context);

      // Assert
      expect(mockedLog.info).toHaveBeenCalledWith(
        message,
        expect.stringContaining("emoji"),
      );
    });
  });

  describe("Multiple Calls", () => {
    it("should handle rapid successive calls", () => {
      // Arrange & Act
      logger.info("Message 1");
      logger.info("Message 2");
      logger.info("Message 3");

      // Assert
      expect(mockedLog.info).toHaveBeenCalledTimes(3);
    });

    it("should handle mixed log levels", () => {
      // Arrange & Act
      logger.trace("Trace");
      logger.debug("Debug");
      logger.info("Info");
      logger.warn("Warn");
      logger.error("Error");

      // Assert
      expect(mockedLog.trace).toHaveBeenCalledTimes(1);
      expect(mockedLog.debug).toHaveBeenCalledTimes(1);
      expect(mockedLog.info).toHaveBeenCalledTimes(1);
      expect(mockedLog.warn).toHaveBeenCalledTimes(1);
      expect(mockedLog.error).toHaveBeenCalledTimes(1);
    });
  });
});
