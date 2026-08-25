import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('Falha inesperada na interface.', { message: error.message, componentStack: info.componentStack });
  }

  render() {
    if (this.state.failed) {
      return <main className="section compact-section"><div className="error-state"><h1>Algo não saiu como esperado.</h1><p>A página encontrou uma falha inesperada. Seus dados salvos não foram alterados.</p><button className="primary-button" onClick={()=>window.location.reload()}>Recarregar página</button><a className="secondary-button" href="/">Voltar ao início</a></div></main>;
    }
    return this.props.children;
  }
}
