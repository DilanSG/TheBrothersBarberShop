import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="max-w-md mx-auto card mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <label className="form-label">Email</label>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" required />
        <label className="form-label">Contraseña</label>
        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="form-input" required />
  {error && <p className="form-error text-center">{error}</p>}
  <button type="submit" className="btn-primary w-full mt-2">Entrar</button>
      </form>
      <div className="text-center mt-4">
        <span>¿No tienes cuenta? </span>
        <a href="/register" className="text-blue-600 hover:underline">Regístrate</a>
      </div>
    </div>
  );
}

export default Login;
