"use client";

import { useState, useRef } from "react";
import { TimeManagement } from "./time-management";
import { PatientList } from "./patient-list";
import { FileOperations } from "./file-operations";
import { PatientDetailsModal } from "./patient-details-modal";
import { DoctorSettingsModal } from "./doctor-settings-modal";
import { Moon, Sun, Globe, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Language = "FR" | "ENG";

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  appointmentTime: string;
  status: "waiting" | "in-session" | "completed";
}

export interface DoctorInfo {
  name: string;
  speciality: string;
  phone: string;
  email: string;
  image: string;
}

const translations = {
  FR: {
    dashboard: "Tableau de Bord",
    consultation: "Gestion des Consultations",
    currentPatient: "Patient Actuel",
    noPatient: "Aucun patient",
    timeManagement: "Gestion du Temps",
    waitingList: "File d'Attente",
    fileOperations: "Fichiers",
    darkMode: "Mode Sombre",
    language: "Langue",
    doctorSettings: "Paramètres",
  },
  ENG: {
    dashboard: "Dashboard",
    consultation: "Consultation Management",
    currentPatient: "Current Patient",
    noPatient: "No patient",
    timeManagement: "Time Management",
    waitingList: "Waiting List",
    fileOperations: "Files",
    darkMode: "Dark Mode",
    language: "Language",
    doctorSettings: "Settings",
  },
};

export function DoctorDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentPatientIndex, setCurrentPatientIndex] = useState<number>(0);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>("FR");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showDoctorSettings, setShowDoctorSettings] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo>({
    name: "Dr. Jean Dupont",
    speciality: "Médecin Généraliste",
    phone: "+33 6 12 34 56 78",
    email: "jean.dupont@clinic.fr",
    image: "https://via.placeholder.com/150",
  });
  const [logoMuted, setLogoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const t = translations[language];

  const handleFinishPatient = () => {
    const updatedPatients = [...patients];
    if (currentPatientIndex < patients.length) {
      updatedPatients[currentPatientIndex].status = "completed";
    }

    if (currentPatientIndex < patients.length - 1) {
      updatedPatients[currentPatientIndex + 1].status = "in-session";
      setCurrentPatientIndex(currentPatientIndex + 1);
    }

    setPatients(updatedPatients);
    setCurrentTime(0);
  };

  const handleSendSMSToAll = () => {
    const waitingPatients = patients.filter((p) => p.status === "waiting");
    if (waitingPatients.length === 0) {
      alert(
        language === "FR" ? "Aucun patient en attente" : "No waiting patients"
      );
      return;
    }

    waitingPatients.forEach((patient) => {
      console.log(
        `SMS sent to ${patient.phone}: "${
          language === "FR"
            ? "Le médecin est disponible. Veuillez vous présenter."
            : "Doctor is available. Please present yourself."
        }"`
      );
    });

    const message =
      language === "FR"
        ? `SMS envoyé à ${waitingPatients.length} patient(s)`
        : `SMS sent to ${waitingPatients.length} patient(s)`;
    alert(message);
  };

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const toggleLogoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setLogoMuted(videoRef.current.muted);
    }
  };

  const currentPatient = patients[currentPatientIndex] || null;
  const waitingPatients = patients.filter((p) => p.status === "waiting");

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-blue-50 via-white to-blue-50"
      }`}
    >
      {/* Header */}
      <header
        className={`${
          darkMode
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-blue-100"
        } border-b shadow-sm sticky top-0 z-40`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Logo Section - Remplace le texte du dashboard */}
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="relative group">
                    <video
                      ref={videoRef}
                      src={`${
                        darkMode ? "/logo-black.mp4" : "/logo-blank.mp4"
                      }`}
                      autoPlay
                      loop
                      muted
                      className="w-50 h-40 rounded-lg object-cover border-2 border-transparent group-hover:border-blue-500 transition-all duration-200"
                      style={{
                        width: "400px",
                        height: "150px",
                        aspectRatio: "1/1",
                      }}
                    />
                    {/* Indicateur de son */}
                    {!logoMuted && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-2 h-2 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDarkMode(!darkMode)}
                className={`h-10 w-10 ${
                  darkMode ? "text-yellow-400" : "text-slate-600"
                }`}
                title={t.darkMode}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>

              <div
                className={`px-2 sm:px-3 py-2 rounded-lg ${
                  darkMode ? "bg-slate-700" : "bg-blue-100"
                } flex items-center gap-1 sm:gap-2`}
              >
                <Globe
                  className={`w-4 h-4 ${
                    darkMode ? "text-slate-400" : "text-blue-600"
                  }`}
                />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className={`bg-transparent font-semibold text-xs sm:text-sm focus:outline-none ${
                    darkMode ? "text-white" : "text-blue-900"
                  }`}
                >
                  <option value="FR">FR</option>
                  <option value="ENG">EN</option>
                </select>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowDoctorSettings(true)}
                className={`h-10 w-10 ${
                  darkMode ? "text-slate-400" : "text-blue-600"
                }`}
                title={t.doctorSettings}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Current Patient - Mobile */}
          <div className="sm:hidden mt-3 p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <p className="text-xs font-medium opacity-90">{t.currentPatient}</p>
            <p className="text-lg font-bold truncate">
              {currentPatient?.name || t.noPatient}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 auto-rows-max lg:auto-rows-max">
          <TimeManagement
            currentTime={currentTime}
            onTimeChange={setCurrentTime}
            onFinishPatient={handleFinishPatient}
            currentPatient={currentPatient}
            darkMode={darkMode}
            language={language}
          />

          <PatientList
            patients={patients}
            onPatientsChange={setPatients}
            currentPatientIndex={currentPatientIndex}
            onPatientSelect={setCurrentPatientIndex}
            onSendSMSToAll={handleSendSMSToAll}
            waitingCount={waitingPatients.length}
            darkMode={darkMode}
            language={language}
            onPatientClick={handlePatientClick}
          />

          <FileOperations
            patients={patients}
            onPatientsImported={setPatients}
            darkMode={darkMode}
            language={language}
          />
        </div>
      </main>

      {/* Modals */}
      {showPatientModal && selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => setShowPatientModal(false)}
          darkMode={darkMode}
          language={language}
        />
      )}

      {showDoctorSettings && (
        <DoctorSettingsModal
          doctorInfo={doctorInfo}
          onSave={setDoctorInfo}
          onClose={() => setShowDoctorSettings(false)}
          darkMode={darkMode}
          language={language}
        />
      )}
    </div>
  );
}
