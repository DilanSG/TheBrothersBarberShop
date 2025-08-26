const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Obtener todos los usuarios (solo admin)
exports.getUsers = async (req, res) => {
    try {
        // Verificar si el usuario es administrador
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Acceso denegado. Se requieren privilegios de administrador'
            });
        }

        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Obtener un usuario por ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Verificar si el usuario solicita sus propios datos o es admin
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Acceso denegado'
            });
        }

        res.json(user);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'ID de usuario inválido'
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos',
                details: errors.array()
            });
        }

        const { name, email } = req.body;
        
        // Verificar si el usuario actualiza sus propios datos o es admin
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Acceso denegado'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            message: 'Usuario actualizado correctamente',
            user
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'ID de usuario inválido'
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'El email ya está en uso'
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Eliminar usuario
exports.deleteUser = async (req, res) => {
    try {
        // Verificar si el usuario se está eliminando a sí mismo o es admin
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Acceso denegado'
            });
        }

        // Prevenir que un usuario se elimine a sí mismo
        if (req.user.id === req.params.id) {
            return res.status(403).json({
                error: 'No puedes eliminar tu propia cuenta'
            });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            message: 'Usuario eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'ID de usuario inválido'
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};