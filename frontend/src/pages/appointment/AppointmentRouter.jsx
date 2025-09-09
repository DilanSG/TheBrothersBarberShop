import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UserAppointment from './UserAppointment';
import BarberAppointment from './BarberAppointment';
import AdminAppointment from './AdminAppointment';

const AppointmentRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  switch (user.role) {
    case 'admin':
      return (
        <Routes>
          <Route path="/" element={<AdminAppointment />} />
          <Route path="/new" element={<AdminAppointment />} />
          <Route path="*" element={<Navigate to="/appointment" replace />} />
        </Routes>
      );
    case 'barber':
      return (
        <Routes>
          <Route path="/" element={<BarberAppointment />} />
          <Route path="/new" element={<BarberAppointment />} />
          <Route path="*" element={<Navigate to="/appointment" replace />} />
        </Routes>
      );
    default:
      return (
        <Routes>
          <Route path="/" element={<UserAppointment />} />
          <Route path="/new" element={<UserAppointment />} />
          <Route path="*" element={<Navigate to="/appointment" replace />} />
        </Routes>
      );
  }
};

export default AppointmentRouter;   

