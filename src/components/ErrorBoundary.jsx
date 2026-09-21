import { Component } from "react";

/**
 * A parsing bug in one panel should not blank the whole dashboard, and it must
 * never look like the data itself is empty.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Replace with your error reporter (Sentry, Rollbar, an internal endpoint).
    console.error("Dashboard error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="panel m-5 p-6">
        <h2 className="font-display text-xl">{this.props.title || "This section could not be displayed"}</h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
          Something in the data made this view fail. Your files are untouched — nothing was uploaded anywhere.
          Reloading usually clears it; if it happens every time, the sheet probably has a shape the parser has not seen.
        </p>
        <pre className="mt-3 overflow-auto bg-canvas p-3 text-xs text-ink2">{String(this.state.error?.message || this.state.error)}</pre>
        <div className="mt-4 flex gap-2">
          <button className="btn btn-primary" onClick={() => this.setState({ error: null })}>Try again</button>
          <button className="btn" onClick={() => window.location.reload()}>Reload the page</button>
        </div>
      </div>
    );
  }
}
