"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Patient, Language } from "./doctor-dashboard"

interface PatientDetailsModalProps {
  patient: Patient
  onClose: () => void
  darkMode: boolean
  language: Language
}

const translations = {
  FR: {
    patientDetails: "Détails du Patient",
    name: "Nom",
    phone: "Téléphone",
    email: "Email",
    appointmentTime: "Heure du Rendez-vous",
    close: "Fermer",
  },
  ENG: {
    patientDetails: "Patient Details",
    name: "Name",
    phone: "Phone",
    email: "Email",
    appointmentTime: "Appointment Time",
    close: "Close",
  },
}

export function PatientDetailsModal({ patient, onClose, darkMode, language }: PatientDetailsModalProps) {
  const t = translations[language]

  return (
    <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-lg max-w-md w-full p-8 ${
          darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-blue-200"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-blue-900"}`}>{t.patientDetails}</h2>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-opacity-10 ${darkMode ? "hover:bg-white" : "hover:bg-blue-500"}`}
          >
            <X className={`w-6 h-6 ${darkMode ? "text-slate-400" : "text-blue-600"}`} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-blue-600"}`}>{t.name}</label>
            <p className={`text-lg font-medium mt-1 ${darkMode ? "text-white" : "text-blue-900"}`}>{patient.name}</p>
          </div>
          <div>
            <label className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-blue-600"}`}>
              {t.phone}
            </label>
            <p className={`text-lg font-medium mt-1 ${darkMode ? "text-white" : "text-blue-900"}`}>{patient.phone}</p>
          </div>
          <div>
            <label className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-blue-600"}`}>
              {t.email}
            </label>
            <p className={`text-lg font-medium mt-1 ${darkMode ? "text-white" : "text-blue-900"}`}>{patient.email}</p>
          </div>
          <div>
            <label className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-blue-600"}`}>
              {t.appointmentTime}
            </label>
            <p className={`text-lg font-medium mt-1 ${darkMode ? "text-white" : "text-blue-900"}`}>
              {patient.appointmentTime || "N/A"}
            </p>
          </div>
        </div>

        <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          {t.close}
        </Button>
      </div>
    </div>
  )
}
