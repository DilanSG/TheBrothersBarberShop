
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import ProfileEdit from './pages/ProfileEdit.jsx';
import BarberProfileEdit from './pages/BarberProfileEdit.jsx';
import Appointment from './pages/Appointment.jsx';
import Barbers from './pages/Barbers.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Inventory from './pages/Inventory.jsx';
import Services from './pages/Services.jsx';

function App() {
	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<div className="container mx-auto px-4 py-8">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route path="/profile" element={
						<ProtectedRoute>
							<Profile />
						</ProtectedRoute>
					} />
					<Route path="/profile-edit" element={
						<ProtectedRoute>
							<ProfileEdit />
						</ProtectedRoute>
					} />
					<Route path="/barber-profile-edit" element={
						<ProtectedRoute roles={['barber', 'admin']}>
							<BarberProfileEdit />
						</ProtectedRoute>
					} />
					<Route path="/appointment" element={
						<ProtectedRoute>
							<Appointment />
						</ProtectedRoute>
					} />
					<Route path="/barbers" element={<Barbers />} />
								<Route path="/services" element={
									<ProtectedRoute roles={['admin', 'barber']}>
										<Services />
									</ProtectedRoute>
								} />
								<Route path="/inventory" element={
									<ProtectedRoute roles={['admin', 'barber']}>
										<Inventory />
									</ProtectedRoute>
								} />
							</Routes>
						</div>
					</div>
					);
				}

				export default App;
