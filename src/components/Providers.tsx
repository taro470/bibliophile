'use client';

import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { ToastProvider } from '@/components/ui';

// Dynamically import amplify_outputs if it exists
let configured = false;

export function Providers({ children }: { children: React.ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (configured) {
      setIsConfigured(true);
      return;
    }

    // Try to load amplify_outputs dynamically
    import('@/amplify_outputs.json')
      .then((outputs) => {
        if (outputs.default?.auth?.user_pool_id) {
          Amplify.configure(outputs.default, { ssr: true });
        }
        configured = true;
        setIsConfigured(true);
      })
      .catch(() => {
        console.warn('Amplify outputs not found. Run `npx ampx sandbox` to generate.');
        configured = true;
        setIsConfigured(true);
      });
  }, []);

  if (!isConfigured) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0a0a0f',
        color: '#f8fafc'
      }}>
        読み込み中...
      </div>
    );
  }

  return (
    <Authenticator.Provider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </Authenticator.Provider>
  );
}
