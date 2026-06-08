import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', gap: 20, padding: 40,
          background: '#050510', color: '#f0f0ff', textAlign: 'center',
        }}>
          <div style={{ fontSize: 64 }}>⚠️</div>
          <h2 style={{ fontFamily: "'Orbitron',sans-serif", color: '#ff2d78' }}>
            Something crashed
          </h2>
          <p style={{ color: '#9090b0', maxWidth: 500, lineHeight: 1.6 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #b44fff, #00f5ff)',
              border: 'none', borderRadius: 50, color: 'white',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Inter',sans-serif",
            }}
          >
            🔄 Reload App
          </button>
          <details style={{ color: '#9090b0', fontSize: 12, maxWidth: 600, textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Technical details</summary>
            <pre style={{ overflow: 'auto', background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8 }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
