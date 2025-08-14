import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function Login() {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      const emailFinal = `${username}@yazaki.com`.toLowerCase();

      await login(emailFinal, password);
      // No redirect aquí
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <div className="logo-wrapper">
            <Image
              src="/logo_app.svg"
              alt="Logo PalletGo"
              width={70}
              height={70}
            />
          </div>
        </div>

        <h1 className="navbar-title">PalletGo</h1>
        <h2>Iniciar sesión</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <label htmlFor="email" className="sr-only">
            Usuario
          </label>
          <input
            id="username"
            type="text"
            placeholder="Usuario"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            required
            autoComplete="username"
          />

          <label htmlFor="password" className="sr-only">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            placeholder="Contraseña"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={isLoggingIn}
            className="login-button"
          >
            {isLoggingIn ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
