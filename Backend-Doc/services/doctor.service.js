const Doctor = require('../models/doctor.model');
const Patient = require('../models/patient.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class DoctorService {
  // Authentification
  static async login(email, password) {
    try {
      const doctor = await Doctor.findOne({ where: { email } });
      
      if (!doctor) {
        throw new Error('Doctor non trouvé');
      }
      
      if (!doctor.isActive && !doctor.isAdmin) {
        throw new Error('Compte non activé. Contactez l\'administrateur.');
      }
      
      const isMatch = await doctor.comparePassword(password);
      
      if (!isMatch) {
        throw new Error('Mot de passe incorrect');
      }
      
      // Mettre à jour lastLogin
      doctor.lastLogin = new Date();
      await doctor.save();
      
      // Générer token
      const token = jwt.sign(
        { 
          id: doctor.id, 
          email: doctor.email, 
          isAdmin: doctor.isAdmin 
        },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '24h' }
      );
      
      // Retirer le mot de passe de la réponse
      const doctorResponse = { ...doctor.toJSON() };
      delete doctorResponse.password;
      
      return { doctor: doctorResponse, token };
    } catch (error) {
      throw error;
    }
  }

  // Créer un médecin
  static async createDoctor(data) {
    try {
      // Vérifier si l'email existe déjà
      const existingDoctor = await Doctor.findOne({ where: { email: data.email } });
      if (existingDoctor) {
        throw new Error('Cet email est déjà utilisé');
      }
      
      const doctor = await Doctor.create(data);
      // Retirer le mot de passe de la réponse
      const doctorResponse = { ...doctor.toJSON() };
      delete doctorResponse.password;
      return doctorResponse;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  // Obtenir tous les médecins (pour admin)
  static async getAllDoctors() {
    try {
      const doctors = await Doctor.findAll({
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']]
      });
      return doctors;
    } catch (error) {
      throw error;
    }
  }

  // Obtenir un médecin par ID
  static async getDoctorById(id) {
    try {
      const doctor = await Doctor.findByPk(id, {
        attributes: { exclude: ['password'] }
      });
      if (!doctor) throw new Error('Doctor non trouvé');
      return doctor;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour un médecin
  static async updateDoctor(id, data) {
    try {
      // Ne pas permettre la modification de isAdmin via cette méthode
      if (data.isAdmin !== undefined) {
        delete data.isAdmin;
      }
      
      const doctor = await Doctor.findByPk(id);
      if (!doctor) throw new Error('Doctor non trouvé');
      
      await doctor.update(data);
      
      // Retirer le mot de passe de la réponse
      const doctorResponse = { ...doctor.toJSON() };
      delete doctorResponse.password;
      return doctorResponse;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  // Archiver/désarchiver un médecin
  static async toggleArchive(id, isArchived) {
    try {
      const doctor = await Doctor.findByPk(id);
      if (!doctor) throw new Error('Doctor non trouvé');
      
      await doctor.update({ isArchived });
      
      // Retirer le mot de passe de la réponse
      const doctorResponse = { ...doctor.toJSON() };
      delete doctorResponse.password;
      return doctorResponse;
    } catch (error) {
      throw error;
    }
  }

  // Activer/désactiver un médecin
  static async toggleActive(id, isActive) {
    try {
      const doctor = await Doctor.findByPk(id);
      if (!doctor) throw new Error('Doctor non trouvé');
      
      await doctor.update({ isActive });
      
      // Retirer le mot de passe de la réponse
      const doctorResponse = { ...doctor.toJSON() };
      delete doctorResponse.password;
      return doctorResponse;
    } catch (error) {
      throw error;
    }
  }

  // Statistiques pour admin
  static async getStats() {
    try {
      const totalDoctors = await Doctor.count();
      const activeDoctors = await Doctor.count({ where: { isActive: true } });
      const archivedDoctors = await Doctor.count({ where: { isArchived: true } });
      const totalPatients = await Patient.count();
      
      // Total SMS envoyés - CORRECTION ICI
      const doctors = await Doctor.findAll({
        attributes: ['smsSentCount']
      });
      
      const totalSMS = doctors.reduce((sum, doc) => sum + (doc.smsSentCount || 0), 0);
      
      return {
        totalDoctors,
        activeDoctors,
        archivedDoctors,
        totalPatients,
        totalSMS
      };
    } catch (error) {
      throw error;
    }
  }

  // Ajouter une action à l'historique
  static async addActionToHistory(doctorId, action, details = {}) {
    try {
      const doctor = await Doctor.findByPk(doctorId);
      if (!doctor) return;
      
      const historiqueActions = Array.isArray(doctor.historiqueActions) 
        ? doctor.historiqueActions 
        : [];
      
      historiqueActions.push({
        action,
        details,
        timestamp: new Date()
      });
      
      await doctor.update({ historiqueActions });
    } catch (error) {
      console.error('Erreur ajout historique:', error);
    }
  }

  // Obtenir l'historique d'un médecin
  static async getDoctorHistory(doctorId) {
    try {
      const doctor = await Doctor.findByPk(doctorId, {
        attributes: ['historiqueActions', 'nomComplet', 'email']
      });
      
      if (!doctor) throw new Error('Doctor non trouvé');
      
      // Trier l'historique par timestamp descendant
      const historique = Array.isArray(doctor.historiqueActions) 
        ? doctor.historiqueActions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        : [];
      
      return {
        doctor: {
          nomComplet: doctor.nomComplet,
          email: doctor.email
        },
        history: historique
      };
    } catch (error) {
      throw error;
    }
  }

  // Rechercher des médecins
  static async searchDoctors(searchTerm) {
    try {
      const doctors = await Doctor.findAll({
        where: {
          [Op.or]: [
            { nomComplet: { [Op.iLike]: `%${searchTerm}%` } },
            { email: { [Op.iLike]: `%${searchTerm}%` } },
            { city: { [Op.iLike]: `%${searchTerm}%` } }
          ]
        },
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']]
      });
      return doctors;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DoctorService;