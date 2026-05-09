import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("[Nyx] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#0e1014",
            color: "#e8eaed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            overflow: "auto",
            fontFamily:
              '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: 720,
              width: "100%",
              background: "#1a1d24",
              border: "1px solid #22262e",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#ef4444",
                marginBottom: 12,
              }}
            >
              Ошибка приложения
            </div>
            <div style={{ fontSize: 13, color: "#9aa0a6", marginBottom: 16 }}>
              Что-то пошло не так. Скриншот ошибки помоги отправить разработчику.
            </div>
            <pre
              style={{
                fontFamily:
                  '"JetBrains Mono", "Fira Code", Consolas, monospace',
                fontSize: 12,
                color: "#ef4444",
                background: "#0a0c0f",
                padding: 12,
                borderRadius: 8,
                overflow: "auto",
                maxHeight: 200,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack}
            </pre>
            {this.state.errorInfo && (
              <pre
                style={{
                  fontFamily:
                    '"JetBrains Mono", "Fira Code", Consolas, monospace',
                  fontSize: 12,
                  color: "#9aa0a6",
                  background: "#0a0c0f",
                  padding: 12,
                  borderRadius: 8,
                  overflow: "auto",
                  maxHeight: 200,
                  marginTop: 12,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null, errorInfo: null });
              }}
              style={{
                marginTop: 16,
                padding: "8px 16px",
                background: "#5b8def",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Попробовать снова
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
