import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import styles from "@/styles/Login.module.css";

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
      const emailFinal = `${username}@yazaki.com`.toLowerCase();
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

        {/* Logo */}
        <div className={styles.logoWrapper}>
          <div className={styles.logoCircle}>
            <Image
              src="/logo_app.svg"
              alt="Logo PalletGo"
              width={70}
              height={70}
            />
          </div>
        </div>

        {/* Título */}
        <h1 className={styles.title}>PalletGo</h1>
        <h2>Iniciar sesión</h2>

        {/* Error con animación shake */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          <label htmlFor="username" className={styles.srOnly}>
            Usuario
          </label>
          <input
            id="username"
            type="text"
            placeholder="Usuario"
            className={styles.inputField}
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            required
            autoComplete="username"
          />

          <label htmlFor="password" className={styles.srOnly}>
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            placeholder="Contraseña"
            className={styles.inputField}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={isLoggingIn}
            className={styles.loginButton}
          >
            {isLoggingIn ? "Ingresando..." : "Ingresar"}
          </button>

        </form>
      </div>
    </div>
  );
}