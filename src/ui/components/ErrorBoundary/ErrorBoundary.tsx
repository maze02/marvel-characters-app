import React, { Component, ReactNode } from "react";
import { logger } from "@infrastructure/logging/Logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary Component
 *
 * Catches React errors and prevents them from crashing the app
 * In production, silently handles errors without logging to console
 * In development, logs errors for debugging
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log in development (logger is silent in production)
    logger.error("React Error Boundary caught an error", error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      // In production, show fallback without console errors
      return (
        this.props.fallback || (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <h2>Something went wrong</h2>
            <p>Please refresh the page to try again.</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
