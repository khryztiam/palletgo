// pages/_app.js
//import { useRouter } from 'next/router';
//import { useEffect } from 'react';
//import AuthGate from '@/components/AuthGate';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';


import '@/styles/global.css';
import '@/styles/navbar.css';
import '@/styles/login.css';
import '@/styles/request.css';
import '@/styles/card.css';
import '@/styles/dispatch.css';
import '@/styles/status-modal.css';
import '@/styles/boarding.css';
import '@/styles/management.css';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Navbar />
      <Component {...pageProps} />
    </AuthProvider>
  );
}
