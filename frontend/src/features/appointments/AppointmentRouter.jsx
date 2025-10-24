import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import UserAppointment from './UserAppointment';
import BarberAppointment from './BarberAppointment';
import AdminAppointment from './AdminAppointment';
import AppointmentEdit from './AppointmentEdit';
import AppointmentDetail from './AppointmentDetail';

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
          <Route path="/edit/:id" element={<AppointmentEdit />} />
          <Route path="/view/:id" element={<AppointmentDetail />} />
          <Route path="*" element={<Navigate to="/appointment" replace />} />
        </Routes>
      );
    case 'barber':
      return (
        <Routes>
          <Route path="/" element={<BarberAppointment />} />
          <Route path="/new" element={<BarberAppointment />} />
          <Route path="/edit/:id" element={<AppointmentEdit />} />
          <Route path="/view/:id" element={<AppointmentDetail />} />
          <Route path="*" element={<Navigate to="/appointment" replace />} />
        </Routes>
      );
    default:
      return (
        <Routes>
          <Route path="/" element={<UserAppointment />} />
          <Route path="/new" element={<UserAppointment />} />
          <Route path="/edit/:id" element={<AppointmentEdit />} />
          <Route path="/view/:id" element={<AppointmentDetail />} />
          <Route path="*" element={<Navigate to="/appointment" replace />} />
        </Routes>
      );
  }
};

export default AppointmentRouter;   

