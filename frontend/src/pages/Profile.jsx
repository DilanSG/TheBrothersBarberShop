import React from 'react';
import { useAuth } from '../utils/AuthContext';

function Profile() {
  const { user } = useAuth();
  if (!user) return <p className="text-center text-red-500 mt-10">No has iniciado sesión.</p>;
  return (
    <div className="max-w-md mx-auto card mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Perfil de usuario</h2>
      <div className="mb-2"><span className="font-semibold">Usuario:</span> {user.username}</div>
      <div className="mb-2"><span className="font-semibold">Email:</span> {user.email}</div>
      <div className="mb-2"><span className="font-semibold">Rol:</span> {user.role || 'usuario'}</div>
    </div>
  );
}

export default Profile;
