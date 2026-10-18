'use client';

import React from 'react';
import { StoreProvider } from '../src/store.jsx';
import App from '../src/App.jsx';

export default function Page() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}
