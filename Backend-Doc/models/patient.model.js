const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Doctor = require('./doctor.model');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  nomComplet: {
    type: DataTypes.STRING,
    allowNull: false
  },

  telephone: {
    type: DataTypes.STRING,
    allowNull: false
  },

  heureRendezVous: {
    type: DataTypes.STRING,
    allowNull: false
  },

  heureEstimee: {
    type: DataTypes.STRING,
    allowNull: false
  },

  termine: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Doctor,
      key: 'id'
    }
  },

  doctorName: {
    type: DataTypes.STRING,
    defaultValue: 'Docteur'
  },

  importFileName: {
    type: DataTypes.STRING
  },

  importDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },

  statut: {
    type: DataTypes.ENUM('en_attente', 'en_cours', 'retarde', 'termine'),
    defaultValue: 'en_attente'
  },

  smsEnvoye: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  dateSMS: {
    type: DataTypes.DATE
  },

  messageSMS: {
    type: DataTypes.TEXT
  },

  retardMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  notes: {
    type: DataTypes.TEXT
  }

}, {
  tableName: 'patients',
  timestamps: true
});

// Associations
Doctor.hasMany(Patient, { foreignKey: 'doctorId', as: 'patients' });
Patient.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

module.exports = Patient;