import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { FiLock, FiUser } from "react-icons/fi";
import styles from "@/styles/Login.module.css";
import packageInfo from "../../package.json";

const DOMAIN = "@yazaki.com";
const APP_VERSION = `v${packageInfo.version}`;

export default function Login() {
  const { login } = useAuth();

  const [username,    setUsername]    = useState('');
  const [password,    setPassword]    = useState('');
  const [error,       setError]       = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      const emailFinal = `${username}${DOMAIN}`.toLowerCase();
      await login(emailFinal, password);
      // Redirect lo maneja AuthContext
    } catch {
      setError('Correo o contraseña incorrectos.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>

        <div className={styles.brandArea}>
          <div className={styles.logoBadge}>
            <Image
              src="/logo_app.svg"
              alt="Logo PalletGo"
              width={72}
              height={72}
              priority
            />
          </div>
          <h1 className={styles.title}>PalletGo</h1>
          <p className={styles.subtitle}>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          <label htmlFor="username" className={styles.srOnly}>
            Usuario
          </label>
          <div className={styles.inputGroup}>
            <FiUser className={styles.inputIcon} aria-hidden="true" />
            <input
              id="username"
              type="text"
              placeholder="Usuario"
              className={styles.inputField}
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              required
              autoComplete="username"
              disabled={isLoggingIn}
            />
          </div>

          <label htmlFor="password" className={styles.srOnly}>
            Contraseña
          </label>
          <div className={styles.inputGroup}>
            <FiLock className={styles.inputIcon} aria-hidden="true" />
            <input
              id="password"
              type="password"
              placeholder="Contraseña"
              className={styles.inputField}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isLoggingIn}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={isLoggingIn}
            className={styles.loginButton}
          >
            {isLoggingIn ? "Ingresando..." : "Ingresar"}
          </button>

        </form>

        <div className={styles.footer}>
          PalletGo {APP_VERSION}
        </div>
      </div>
    </div>
  );
}
