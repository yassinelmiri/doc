const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const sequelize = require('./config/database');
const Doctor = require('./models/doctor.model');
const Patient = require('./models/patient.model');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Synchronisation de la base de données
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connecté à PostgreSQL');
    
    // Synchronisation des modèles
    await sequelize.sync({ alter: true });
    console.log('✅ Modèles synchronisés');
    
    // Création de l'admin par défaut
    await Doctor.createDefaultAdmin();
  } catch (error) {
    console.error('❌ Erreur de base de données:', error);
  }
};

// Routes
app.use('/api/doctors', require('./routes/doctor.routes'));
app.use('/api/patients', require('./routes/patient.routes'));

// Route racine
app.get('/', (req, res) => {
  res.send('🚀 Serveur DocNoti en marche !');
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route non trouvée' 
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err.stack);
  
  // Gérer les erreurs de multer
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux (max 10MB)'
      });
    }
  }
  
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Démarrer le serveur
app.listen(PORT, async () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  await syncDatabase();
});