import { Component, type ReactNode } from "react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
            <h1 className="text-xl font-semibold text-red-600 mb-2">
              Произошла ошибка
            </h1>
            <p className="text-gray-600 mb-4">
              {this.state.error.message}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
            >
              Вернуться на главную
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
