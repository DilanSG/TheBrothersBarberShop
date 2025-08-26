import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Usuario registrado. Ahora puedes iniciar sesión.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.message || 'Error al registrar');
      }
    } catch {
      setError('Error de red');
    }
  };

  return (
    <div className="max-w-md mx-auto card mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Registro</h2>
      <form onSubmit={handleSubmit}>
        <label className="form-label">Usuario</label>
        <input type="text" placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} className="form-input" required />
        <label className="form-label">Email</label>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" required />
        <label className="form-label">Contraseña</label>
        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="form-input" required />
  {error && <p className="form-error text-center">{error}</p>}
  {success && <p className="form-success text-center">{success}</p>}
  <button type="submit" className="btn-primary w-full mt-2">Registrarse</button>
      </form>
      <div className="text-center mt-4">
        <span>¿Ya tienes cuenta? </span>
        <a href="/login" className="text-blue-600 hover:underline">Inicia sesión</a>
      </div>
    </div>
  );
}

export default Register;
