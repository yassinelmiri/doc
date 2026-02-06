const Patient = require('../models/patient.model');
const Doctor = require('../models/doctor.model');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

class PatientService {
  // Créer un patient
  static async createPatient(data, doctorId) {
    try {
      const doctor = await Doctor.findByPk(doctorId);
      if (!doctor) {
        throw new Error('Médecin non trouvé');
      }
      
      // Valider les données requises
      if (!data.nomComplet || !data.telephone || !data.heureRendezVous) {
        throw new Error('Les champs nomComplet, telephone et heureRendezVous sont requis');
      }
      
      const patientData = {
        ...data,
        doctorId,
        doctorName: `${doctor.nomComplet}`
      };
      
      const patient = await Patient.create(patientData);
      return patient;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw new Error(`Erreur création patient: ${error.message}`);
    }
  }

  // Obtenir un patient par ID
  static async getPatientById(patientId, doctorId) {
    try {
      const patient = await Patient.findOne({
        where: { 
          id: patientId,
          doctorId 
        },
        include: [{
          model: Doctor,
          as: 'doctor',
          attributes: ['id', 'nomComplet', 'email']
        }]
      });
      
      if (!patient) {
        throw new Error('Patient non trouvé');
      }
      
      return patient;
    } catch (error) {
      throw new Error(`Erreur récupération patient: ${error.message}`);
    }
  }

  // Importer depuis fichier
  static async importFromFile(filePath, doctorId, fileName) {
    try {
      console.log('Import depuis fichier:', filePath);
      
      const doctor = await Doctor.findByPk(doctorId);
      if (!doctor) {
        throw new Error('Médecin non trouvé');
      }

      const ext = path.extname(filePath).toLowerCase();
      let patients = [];

      if (ext === '.csv') {
        patients = await this.parseCSV(filePath, doctorId, doctor.nomComplet, fileName);
      } else if (ext === '.xlsx' || ext === '.xls') {
        patients = await this.parseExcel(filePath, doctorId, doctor.nomComplet, fileName);
      } else {
        throw new Error('Format de fichier non supporté. Utilisez CSV ou Excel.');
      }

      console.log(`${patients.length} patients parsés`);

      if (patients.length === 0) {
        throw new Error('Aucun patient valide trouvé dans le fichier');
      }

      // Sauvegarder tous les patients
      const savedPatients = [];
      for (const patientData of patients) {
        try {
          const patient = await Patient.create(patientData);
          savedPatients.push(patient);
          console.log(`Patient sauvegardé: ${patientData.nomComplet}`);
        } catch (error) {
          console.error(`Erreur sauvegarde patient ${patientData.nomComplet}:`, error.message);
          continue;
        }
      }

      if (savedPatients.length === 0) {
        throw new Error('Aucun patient n\'a pu être sauvegardé en base de données');
      }

      return savedPatients;
    } catch (error) {
      throw new Error(`Erreur import fichier: ${error.message}`);
    }
  }

  // Parser CSV
  static parseCSV(filePath, doctorId, doctorName, fileName) {
    return new Promise((resolve, reject) => {
      const patients = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            console.log('Ligne CSV:', row);
            
            // Essayer différents formats de noms de colonnes
            const nomComplet = row.nomComplet || row['nom-complet'] || row.Nom || row.nom;
            const telephone = row.telephone || row['num-telephone'] || row.Téléphone || row.tel;
            const heureRendezVous = row.heureRendezVous || row['heure-de-rendez-vous'] || row['Heure RDV'] || row.heure;
            const heureEstimee = row.heureEstimee || row['heure-estimee'] || row['Heure estimée'] || heureRendezVous;
            
            // Validation minimale
            if (!nomComplet || !telephone) {
              console.warn('Ligne ignorée - nom ou téléphone manquant:', row);
              return;
            }
            
            const patient = {
              nomComplet: String(nomComplet).trim(),
              telephone: String(telephone).trim(),
              heureRendezVous: heureRendezVous ? String(heureRendezVous).trim() : new Date().toISOString(),
              heureEstimee: heureEstimee ? String(heureEstimee).trim() : new Date().toISOString(),
              doctorId,
              doctorName,
              importFileName: fileName,
              importDate: new Date(),
              statut: 'en_attente',
              termine: false,
              smsEnvoye: false
            };
            
            patients.push(patient);
          } catch (error) {
            console.error('Erreur parsing ligne CSV:', error);
          }
        })
        .on('end', () => {
          console.log(`Parsing CSV terminé: ${patients.length} patients trouvés`);
          resolve(patients);
        })
        .on('error', (error) => {
          reject(new Error(`Erreur lecture CSV: ${error.message}`));
        });
    });
  }

  // Parser Excel
  static async parseExcel(filePath, doctorId, doctorName, fileName) {
    try {
      console.log('Parsing Excel:', filePath);
      
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        throw new Error('Fichier Excel vide');
      }

      const patients = [];

      data.forEach((row, index) => {
        try {
          console.log(`Ligne Excel ${index}:`, row);
          
          const nomComplet = row.nomComplet || row['nom-complet'] || row.Nom || row.nom;
          const telephone = row.telephone || row['num-telephone'] || row.Téléphone || row.tel;
          const heureRendezVous = row.heureRendezVous || row['heure-de-rendez-vous'] || row['Heure RDV'] || row.heure;
          const heureEstimee = row.heureEstimee || row['heure-estimee'] || row['Heure estimée'] || heureRendezVous;
          
          // Validation minimale
          if (!nomComplet || !telephone) {
            console.warn(`Ligne ${index} ignorée - nom ou téléphone manquant`);
            return;
          }

          const patient = {
            nomComplet: String(nomComplet).trim(),
            telephone: String(telephone).trim(),
            heureRendezVous: heureRendezVous ? String(heureRendezVous).trim() : new Date().toISOString(),
            heureEstimee: heureEstimee ? String(heureEstimee).trim() : new Date().toISOString(),
            doctorId,
            doctorName,
            importFileName: fileName,
            importDate: new Date(),
            statut: 'en_attente',
            termine: false,
            smsEnvoye: false
          };

          patients.push(patient);
        } catch (error) {
          console.error(`Erreur ligne Excel ${index}:`, error);
        }
      });

      console.log(`Parsing Excel terminé: ${patients.length} patients trouvés`);
      return patients;
    } catch (error) {
      throw new Error(`Erreur parsing Excel: ${error.message}`);
    }
  }

  // Exporter en CSV
  static async exportToCSV(doctorId) {
    try {
      const patients = await Patient.findAll({
        where: { doctorId },
        order: [['heureRendezVous', 'ASC']]
      });
      
      if (patients.length === 0) {
        throw new Error('Aucun patient à exporter');
      }

      // Créer les lignes CSV
      const headers = ['nomComplet', 'telephone', 'heureRendezVous', 'heureEstimee', 'statut', 'notes'];
      
      const rows = patients.map(patient => [
        patient.nomComplet,
        patient.telephone,
        patient.heureRendezVous,
        patient.heureEstimee,
        patient.statut,
        patient.notes || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          const str = String(cell);
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(','))
      ].join('\n');

      return csvContent;
    } catch (error) {
      throw new Error(`Erreur export CSV: ${error.message}`);
    }
  }

  // Exporter en Excel
  static async exportToExcel(doctorId) {
    try {
      const patients = await Patient.findAll({
        where: { doctorId },
        order: [['heureRendezVous', 'ASC']]
      });
      
      if (patients.length === 0) {
        throw new Error('Aucun patient à exporter');
      }

      const data = patients.map(patient => ({
        nomComplet: patient.nomComplet,
        telephone: patient.telephone,
        heureRendezVous: patient.heureRendezVous,
        heureEstimee: patient.heureEstimee,
        statut: patient.statut,
        notes: patient.notes || ''
      }));

      const worksheet = xlsx.utils.json_to_sheet(data);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Patients');

      const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return excelBuffer;
    } catch (error) {
      throw new Error(`Erreur export Excel: ${error.message}`);
    }
  }

  // Envoyer SMS à un patient
  static async sendSMS(patientId, doctorId, message) {
    try {
      const patient = await Patient.findOne({ 
        where: { id: patientId, doctorId } 
      });
      
      if (!patient) {
        throw new Error('Patient non trouvé');
      }

      if (!message || message.trim() === '') {
        throw new Error('Le message SMS est requis');
      }

      // Simulation d'envoi SMS
      console.log(`SMS envoyé à ${patient.nomComplet} (${patient.telephone}): ${message}`);

      // Mettre à jour le patient
      await patient.update({
        smsEnvoye: true,
        dateSMS: new Date(),
        messageSMS: message
      });

      // Incrémenter le compteur SMS du médecin
      const doctor = await Doctor.findByPk(doctorId);
      if (doctor) {
        await doctor.update({
          smsSentCount: (doctor.smsSentCount || 0) + 1
        });
      }

      return {
        success: true,
        message: `SMS simulé envoyé à ${patient.nomComplet}`,
        patient: patient.nomComplet,
        telephone: patient.telephone
      };
    } catch (error) {
      throw new Error(`Erreur envoi SMS: ${error.message}`);
    }
  }

  // Envoyer SMS en masse pour retard
  static async sendBulkDelaySMS(doctorId) {
    try {
      const patients = await Patient.findAll({
        where: {
          doctorId,
          statut: 'en_attente',
          smsEnvoye: false
        }
      });

      const results = [];
      let smsCount = 0;

      for (const patient of patients) {
        try {
          // Simuler l'envoi SMS
          console.log(`SMS de retard envoyé à ${patient.nomComplet}`);
          
          await patient.update({
            smsEnvoye: true,
            dateSMS: new Date(),
            messageSMS: `Votre rendez-vous de ${patient.heureRendezVous} est retardé.`
          });

          smsCount++;
          results.push({
            patient: patient.nomComplet,
            telephone: patient.telephone,
            success: true
          });
        } catch (error) {
          results.push({
            patient: patient.nomComplet,
            telephone: patient.telephone,
            success: false,
            error: error.message
          });
        }
      }

      // Mettre à jour le compteur SMS du médecin
      if (smsCount > 0) {
        const doctor = await Doctor.findByPk(doctorId);
        if (doctor) {
          await doctor.update({
            smsSentCount: (doctor.smsSentCount || 0) + smsCount
          });
        }
      }

      return {
        totalPatients: patients.length,
        smsSent: smsCount,
        details: results
      };
    } catch (error) {
      throw new Error(`Erreur envoi SMS masse: ${error.message}`);
    }
  }

  // Obtenir les patients par médecin
  static async getPatientsByDoctor(doctorId, filters = {}) {
    try {
      const whereClause = { doctorId };
      
      if (filters.statut) {
        whereClause.statut = filters.statut;
      }
      if (filters.termine !== undefined) {
        whereClause.termine = filters.termine === 'true';
      }
      if (filters.date) {
        const startDate = new Date(filters.date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(filters.date);
        endDate.setHours(23, 59, 59, 999);
        
        whereClause.createdAt = {
          [Op.between]: [startDate, endDate]
        };
      }

      const patients = await Patient.findAll({
        where: whereClause,
        include: [{
          model: Doctor,
          as: 'doctor',
          attributes: ['id', 'nomComplet', 'email']
        }],
        order: [['heureRendezVous', 'ASC']]
      });

      return patients;
    } catch (error) {
      throw new Error(`Erreur récupération patients: ${error.message}`);
    }
  }

  // Mettre à jour un patient
  static async updatePatient(patientId, doctorId, updateData) {
    try {
      const patient = await Patient.findOne({
        where: { id: patientId, doctorId }
      });

      if (!patient) {
        throw new Error('Patient non trouvé');
      }

      await patient.update(updateData);
      return patient;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(error.errors.map(e => e.message).join(', '));
      }
      throw new Error(`Erreur mise à jour patient: ${error.message}`);
    }
  }

  // Supprimer un patient
  static async deletePatient(patientId, doctorId) {
    try {
      const patient = await Patient.findOne({
        where: { id: patientId, doctorId }
      });
      
      if (!patient) {
        throw new Error('Patient non trouvé');
      }

      await patient.destroy();
      return patient;
    } catch (error) {
      throw new Error(`Erreur suppression patient: ${error.message}`);
    }
  }

  // Obtenir les statistiques des patients
  static async getPatientStats(doctorId) {
    try {
      const totalPatients = await Patient.count({ where: { doctorId } });
      const patientsEnAttente = await Patient.count({ 
        where: { doctorId, statut: 'en_attente' } 
      });
      const patientsTermine = await Patient.count({ 
        where: { doctorId, statut: 'termine' } 
      });
      const patientsRetarde = await Patient.count({ 
        where: { doctorId, statut: 'retarde' } 
      });
      const smsEnvoyes = await Patient.count({ 
        where: { doctorId, smsEnvoye: true } 
      });

      return {
        totalPatients,
        patientsEnAttente,
        patientsTermine,
        patientsRetarde,
        smsEnvoyes
      };
    } catch (error) {
      throw new Error(`Erreur statistiques patients: ${error.message}`);
    }
  }

  // Rechercher des patients
  static async searchPatients(doctorId, searchTerm) {
    try {
      const patients = await Patient.findAll({
        where: {
          doctorId,
          [Op.or]: [
            { nomComplet: { [Op.iLike]: `%${searchTerm}%` } },
            { telephone: { [Op.iLike]: `%${searchTerm}%` } },
            { notes: { [Op.iLike]: `%${searchTerm}%` } }
          ]
        },
        include: [{
          model: Doctor,
          as: 'doctor',
          attributes: ['id', 'nomComplet', 'email']
        }],
        order: [['heureRendezVous', 'ASC']]
      });

      return patients;
    } catch (error) {
      throw new Error(`Erreur recherche patients: ${error.message}`);
    }
  }
}

module.exports = PatientService;