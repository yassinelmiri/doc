"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Users, MessageSquare, ChevronDown } from "lucide-react"
import type { Patient, Language } from "./doctor-dashboard"

interface PatientListProps {
  patients: Patient[]
  onPatientsChange: (patients: Patient[]) => void
  currentPatientIndex: number
  onPatientSelect: (index: number) => void
  onSendSMSToAll: () => void
  waitingCount: number
  darkMode: boolean
  language: Language
  onPatientClick: (patient: Patient) => void
}

const translations = {
  FR: {
    waitingList: "File d'Attente",
    patientName: "Nom",
    phone: "Téléphone",
    email: "Email",
    appointmentTime: "Heure",
    save: "Enregistrer",
    cancel: "Annuler",
    addPatient: "Ajouter",
    delete: "Supprimer",
    sms: "SMS",
    noPatients: "Aucun patient",
    addFirst: "Ajoutez un patient",
    inSession: "Actuel",
    waiting: "Attente",
    completed: "Terminé",
  },
  ENG: {
    waitingList: "Waiting List",
    patientName: "Name",
    phone: "Phone",
    email: "Email",
    appointmentTime: "Time",
    save: "Save",
    cancel: "Cancel",
    addPatient: "Add",
    delete: "Delete",
    sms: "SMS",
    noPatients: "No patients",
    addFirst: "Add a patient",
    inSession: "Current",
    waiting: "Waiting",
    completed: "Done",
  },
}

export function PatientList({
  patients,
  onPatientsChange,
  currentPatientIndex,
  onPatientSelect,
  onSendSMSToAll,
  waitingCount,
  darkMode,
  language,
  onPatientClick,
}: PatientListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Patient, "id">>({
    name: "",
    phone: "",
    email: "",
    appointmentTime: "",
    status: "waiting",
  })

  const t = translations[language]

  const handleAddPatient = () => {
    if (formData.name && formData.phone) {
      const newPatient: Patient = {
        id: Date.now().toString(),
        ...formData,
        status: "waiting",
      }
      onPatientsChange([...patients, newPatient])
      setFormData({
        name: "",
        phone: "",
        email: "",
        appointmentTime: "",
        status: "waiting",
      })
      setIsAdding(false)
    }
  }

  const handleDeletePatient = (id: string) => {
    const newPatients = patients.filter((p) => p.id !== id)
    onPatientsChange(newPatients)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return darkMode
          ? "bg-yellow-900 text-yellow-200 border-yellow-700"
          : "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "in-session":
        return darkMode ? "bg-blue-900 text-blue-200 border-blue-700" : "bg-blue-100 text-blue-800 border-blue-300"
      case "completed":
        return darkMode
          ? "bg-green-900 text-green-200 border-green-700"
          : "bg-green-100 text-green-800 border-green-300"
      default:
        return darkMode ? "bg-slate-700 text-slate-200" : "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card
      className={`shadow-lg h-full flex flex-col transition-all p-4 sm:p-6 lg:p-8 ${
        darkMode
          ? "bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600"
          : "bg-gradient-to-br from-blue-50 to-white border-blue-200"
      } border`}
    >
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Users className={`w-5 h-5 sm:w-6 sm:h-6 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
        <h2 className={`text-lg sm:text-2xl font-bold ${darkMode ? "text-white" : "text-blue-900"}`}>
          {t.waitingList}
        </h2>
      </div>

      {isAdding && (
        <div
          className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${
            darkMode ? "bg-slate-700 border-slate-600" : "bg-white border-blue-200"
          }`}
        >
          <div className="space-y-2 sm:space-y-3">
            <Input
              placeholder={t.patientName}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`text-sm ${
                darkMode ? "bg-slate-800 border-slate-600 text-white" : "border-blue-300 bg-white"
              }`}
            />
            <Input
              placeholder={t.phone}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`text-sm ${
                darkMode ? "bg-slate-800 border-slate-600 text-white" : "border-blue-300 bg-white"
              }`}
            />
            <Input
              placeholder={t.email}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`text-sm ${
                darkMode ? "bg-slate-800 border-slate-600 text-white" : "border-blue-300 bg-white"
              }`}
            />
            <Input
              placeholder={t.appointmentTime}
              type="time"
              value={formData.appointmentTime}
              onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
              className={`text-sm ${
                darkMode ? "bg-slate-800 border-slate-600 text-white" : "border-blue-300 bg-white"
              }`}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddPatient}
                className="flex-1 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                {t.save}
              </Button>
              <Button
                onClick={() => setIsAdding(false)}
                variant="outline"
                className={`flex-1 text-sm font-semibold ${
                  darkMode
                    ? "border-slate-600 text-slate-400 hover:bg-slate-700"
                    : "text-blue-700 border-blue-300 hover:bg-blue-50"
                }`}
              >
                {t.cancel}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 sm:mb-4">
        <Button
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          className="flex-1 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">{t.addPatient}</span>
          <span className="sm:hidden">Add</span>
        </Button>
        <Button
          onClick={onSendSMSToAll}
          disabled={waitingCount === 0}
          className="flex-1 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
        >
          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          {t.sms} ({waitingCount})
        </Button>
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pr-2">
        {patients.length === 0 ? (
          <div className={`text-center py-8 sm:py-12 ${darkMode ? "text-slate-400" : "text-blue-600"}`}>
            <Users className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-30" />
            <p className="font-medium text-sm sm:text-base">{t.noPatients}</p>
            <p className="text-xs mt-1">{t.addFirst}</p>
          </div>
        ) : (
          patients.map((patient, index) => (
            <div
              key={patient.id}
              className={`rounded-lg border-2 transition-all ${
                currentPatientIndex === index
                  ? darkMode
                    ? "bg-blue-900 border-blue-500 shadow-md"
                    : "bg-blue-100 border-blue-500 shadow-md"
                  : darkMode
                    ? "bg-slate-700 border-slate-600 hover:border-slate-500"
                    : "bg-white border-blue-100 hover:border-blue-300"
              }`}
            >
              <div
                onClick={() => {
                  onPatientSelect(index)
                  onPatientClick(patient)
                }}
                className="p-3 sm:p-4 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-bold text-sm sm:text-base truncate ${darkMode ? "text-white" : "text-blue-900"}`}
                    >
                      {patient.name}
                    </p>
                    <p className={`text-xs sm:text-sm truncate ${darkMode ? "text-slate-400" : "text-blue-600"}`}>
                      {patient.phone}
                    </p>
                  </div>
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold border ml-2 flex-shrink-0 ${getStatusColor(patient.status)}`}
                  >
                    {patient.status === "in-session"
                      ? t.inSession
                      : patient.status === "waiting"
                        ? t.waiting
                        : t.completed}
                  </span>
                </div>
              </div>

              {/* Expandable Details */}
              <div className="px-3 sm:px-4 pb-2">
                <button
                  onClick={() => setExpandedId(expandedId === patient.id ? null : patient.id)}
                  className={`text-xs sm:text-sm font-semibold flex items-center gap-1 mb-2 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${expandedId === patient.id ? "rotate-180" : ""}`}
                  />
                  Details
                </button>

                {expandedId === patient.id && (
                  <div
                    className={`mb-2 p-2 sm:p-3 rounded bg-opacity-50 ${darkMode ? "bg-slate-600" : "bg-blue-50"} text-xs sm:text-sm space-y-1`}
                  >
                    <p>
                      <span className="font-semibold">{t.email}:</span> {patient.email || "-"}
                    </p>
                    <p>
                      <span className="font-semibold">{t.appointmentTime}:</span> {patient.appointmentTime || "-"}
                    </p>
                  </div>
                )}

                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePatient(patient.id)
                  }}
                  size="sm"
                  className="w-full text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white font-semibold py-1 sm:py-2"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {t.delete}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
