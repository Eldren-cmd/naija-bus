import { Component, type ErrorInfo, type ReactNode } from "react";

type GlobalErrorBoundaryProps = {
  children: ReactNode;
};

type GlobalErrorBoundaryState = {
  hasError: boolean;
  incidentId: string;
};

const buildIncidentId = (): string => `NT-${Date.now().toString(36).toUpperCase()}`;

export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  state: GlobalErrorBoundaryState = {
    hasError: false,
    incidentId: "",
  };

  static getDerivedStateFromError(): Partial<GlobalErrorBoundaryState> {
    return {
      hasError: true,
      incidentId: buildIncidentId(),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[global-error-boundary] Unhandled render error:", error, info);
  }

  private handleTryAgain = () => {
    this.setState({
      hasError: false,
      incidentId: "",
    });
  };

  private handleGoHome = () => {
    window.location.assign("/map");
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="app-shell error-boundary-shell">
        <section className="error-boundary-card card">
          <p className="kicker">Unexpected Error</p>
          <h1>Something went wrong.</h1>
          <p className="muted">
            The app hit an unexpected issue. Your session is still safe. Try refreshing this screen
            or return to Route Finder.
          </p>
          <p className="muted small">Incident ID: {this.state.incidentId}</p>
          <div className="error-boundary-actions">
            <button type="button" className="estimate-btn" onClick={this.handleTryAgain}>
              Try Again
            </button>
            <button type="button" className="secondary-btn" onClick={this.handleGoHome}>
              Route Finder
            </button>
            <button type="button" className="secondary-btn" onClick={this.handleReload}>
              Reload App
            </button>
          </div>
        </section>
      </main>
    );
  }
}
