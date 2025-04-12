// pages/_app.js
//import { useRouter } from 'next/router';
//import { useEffect } from 'react';
//import AuthGate from '@/components/AuthGate';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import Head from 'next/head';


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
        <Head>
          <title>PalletGo App</title>
          <link rel="icon" href="/favicon.ico" />
          <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
          <link rel="manifest" href="/site.webmanifest"/>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#000000" />
          <meta
            name="PalletGo WebApp"
            content="Web site created for send request to boarding area from production"
          />
        </Head>
        <Navbar />
      <Component {...pageProps} />
    </AuthProvider>
  );
}
