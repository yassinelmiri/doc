"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { DoctorInfo, Language } from "./doctor-dashboard"

interface DoctorSettingsModalProps {
  doctorInfo: DoctorInfo
  onSave: (info: DoctorInfo) => void
  onClose: () => void
  darkMode: boolean
  language: Language
}

const translations = {
  FR: {
    doctorSettings: "Paramètres Médecin",
    name: "Nom Complet",
    speciality: "Spécialité",
    phone: "Téléphone",
    email: "Email",
    image: "URL de l'Image",
    save: "Enregistrer",
    cancel: "Annuler",
  },
  ENG: {
    doctorSettings: "Doctor Settings",
    name: "Full Name",
    speciality: "Speciality",
    phone: "Phone",
    email: "Email",
    image: "Image URL",
    save: "Save",
    cancel: "Cancel",
  },
}

export function DoctorSettingsModal({ doctorInfo, onSave, onClose, darkMode, language }: DoctorSettingsModalProps) {
  const [formData, setFormData] = useState(doctorInfo)
  const t = translations[language]

  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-lg max-w-md w-full p-8 max-h-[90vh] overflow-y-auto ${
          darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-blue-200"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-blue-900"}`}>{t.doctorSettings}</h2>
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
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`mt-2 ${darkMode ? "bg-slate-700 border-slate-600 text-white" : "border-blue-300"}`}
            />
          </div>
          <div>
            <label className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-blue-600"}`}>
              {t.speciality}
            </label>
            <Input
              value={formData.speciality}
              onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
              className={`mt-2 ${darkMode ? "bg-slate-700 border-slate-600 text-white" : "border-blue-300"}`}
            />
          </div>
          <div>
            <label className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-blue-600"}`}>
              {t.phone}
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`mt-2 ${darkMode ? "bg-slate-700 border-slate-600 text-white" : "border-blue-300"}`}
            />
          </div>
          <div>
            <label className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-blue-600"}`}>
              {t.email}
            </label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`mt-2 ${darkMode ? "bg-slate-700 border-slate-600 text-white" : "border-blue-300"}`}
            />
          </div>
          <div>
            <label className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-blue-600"}`}>
              {t.image}
            </label>
            <Input
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className={`mt-2 ${darkMode ? "bg-slate-700 border-slate-600 text-white" : "border-blue-300"}`}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold">
            {t.save}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className={`flex-1 font-semibold ${
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
  )
}
