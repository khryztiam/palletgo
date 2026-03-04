// pages/_app.js
//import { useRouter } from 'next/router';
//import { useEffect } from 'react';
//import AuthGate from '@/components/AuthGate';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Sidebar';
import Layout from '@/components/Layout';
import Head from 'next/head';

import Snowfall from 'react-snowfall';

import '@/styles/global.css';
import '@/styles/countdown.css';
import AdminGate from '@/components/AdminGate';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
        {/* --- Componente de Nieve: Colocado Aquí --- 
        <Snowfall 
          // Estilos para cubrir toda la pantalla (viewport)
          style={{ 
            position: 'fixed', 
            width: '100vw', 
            height: '100vh',
            zIndex: 9999, // Asegura que esté encima de todo el contenido
            pointerEvents: 'none' // ¡Crucial! Permite clics e interacción a través de la nieve
          }}
          // Personalización (opcional)
          snowflakeCount={150} // Puedes ajustar la cantidad
          speed={[1.0, 3.0]}  // Rango de velocidad de caída
          wind={[-0.5, 2.0]}  // Rango de movimiento lateral (viento)
        />
         ----------------------------------------- */}
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
        <AdminGate>
          <Layout>
             <Component {...pageProps} />
          </Layout>
        </AdminGate>
    </AuthProvider>
  );
}
