const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  nomComplet: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le nom complet est requis'
      }
    }
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Veuillez fournir un email valide'
      },
      notEmpty: {
        msg: 'L\'email est requis'
      }
    }
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [6, Infinity],
        msg: 'Le mot de passe doit contenir au moins 6 caractères'
      }
    }
  },

  address: {
    type: DataTypes.STRING,
    defaultValue: ''
  },

  postalCode: {
    type: DataTypes.STRING,
    defaultValue: ''
  },

  city: {
    type: DataTypes.STRING,
    defaultValue: ''
  },

  specialties: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },

  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  lastLogin: {
    type: DataTypes.DATE
  },

  smsSentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  historiqueActions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },

  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'doctors',
  timestamps: true,
  hooks: {
    beforeCreate: async (doctor) => {
      if (doctor.password) {
        const salt = await bcrypt.genSalt(10);
        doctor.password = await bcrypt.hash(doctor.password, salt);
      }
    },
    beforeUpdate: async (doctor) => {
      if (doctor.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        doctor.password = await bcrypt.hash(doctor.password, salt);
      }
    }
  }
});

// Méthode pour comparer les mots de passe
Doctor.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode statique pour créer l'admin par défaut
Doctor.createDefaultAdmin = async function() {
  try {
    const adminExists = await this.findOne({ where: { email: 'admin@doc.com' } });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('0000', salt);
      
      await this.create({
        nomComplet: 'Administrateur',
        email: 'admin@doc.com',
        password: hashedPassword,
        isAdmin: true,
        isActive: true,
        specialties: []
      });
      
      console.log('✅ Admin par défaut créé');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
  }
};

module.exports = Doctor;