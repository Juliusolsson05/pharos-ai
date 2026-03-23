'use client';

import { Component } from 'react';

type Props = { children: React.ReactNode };
type State = { error: Error | null; key: number };

/**
 * Catches the luma.gl HMR crash (maxTextureDimension2D)
 * and auto-remounts the DeckGL tree after a short delay.
 */
export class MapErrorBoundary extends Component<Props, State> {
  state: State = { error: null, key: 0 };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch() {
    // Auto-recover after 500ms by remounting with a new key
    setTimeout(() => {
      this.setState(prev => ({ error: null, key: prev.key + 1 }));
    }, 500);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
          <span className="mono text-[length:var(--text-body-sm)] text-[var(--t4)]">Reloading map…</span>
        </div>
      );
    }
    return <div key={this.state.key} className="flex-1 flex" style={{ minHeight: 0 }}>{this.props.children}</div>;
  }
}
