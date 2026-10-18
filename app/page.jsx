'use client';

import React from 'react';
import { StoreProvider } from '../src/store.jsx';
import App from '../src/App.jsx';
import ErrorBoundary from '../src/ErrorBoundary.jsx';

export default function Page() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <App />
      </StoreProvider>
    </ErrorBoundary>
  );
}
