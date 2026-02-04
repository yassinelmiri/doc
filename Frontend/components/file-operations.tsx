"use client"

import type React from "react"
import { useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Upload, FileText } from "lucide-react"
import type { Patient, Language } from "./doctor-dashboard"

interface FileOperationsProps {
  patients: Patient[]
  onPatientsImported: (patients: Patient[]) => void
  darkMode: boolean
  language: Language
}

const translations = {
  FR: {
    fileManagement: "Fichiers",
    importPatientData: "Importer",
    importCSVXLSXPDF: "Importer CSV",
    fileFormats: "CSV, XLSX, PDF",
    exportPatientData: "Exporter",
    exportCSV: "CSV",
    exportJSON: "JSON",
    statistics: "Statistiques",
    totalPatients: "Total",
    waiting: "Attente",
    completed: "Terminés",
    noPatients: "Aucun patient",
    csvParsingError: "Erreur CSV",
  },
  ENG: {
    fileManagement: "Files",
    importPatientData: "Import",
    importCSVXLSXPDF: "Import CSV",
    fileFormats: "CSV, XLSX, PDF",
    exportPatientData: "Export",
    exportCSV: "CSV",
    exportJSON: "JSON",
    statistics: "Statistics",
    totalPatients: "Total",
    waiting: "Waiting",
    completed: "Done",
    noPatients: "No patients",
    csvParsingError: "CSV error",
  },
}

function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split("\n").filter((line) => line.trim())
  if (lines.length === 0) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ""
    })
    rows.push(row)
  }

  return rows
}

export function FileOperations({ patients, onPatientsImported, darkMode, language }: FileOperationsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = translations[language]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileType = file.name.split(".").pop()?.toLowerCase()

    if (fileType === "csv") {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const csvContent = event.target?.result as string
          const data = parseCSV(csvContent)
          const importedPatients = data.map((p) => ({
            name: p.name || "Unknown",
            phone: p.phone || "",
            email: p.email || "",
            appointmentTime: p.appointmentTime || "",
            status: (p.status as "waiting" | "in-session" | "completed") || "waiting",
            id: Date.now().toString() + Math.random(),
          }))
          onPatientsImported([...patients, ...importedPatients])
        } catch (error) {
          alert(`${t.csvParsingError}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }
      reader.readAsText(file)
    } else {
      alert(language === "FR" ? "Format non supporté. Utilisez CSV." : "Unsupported format. Use CSV.")
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleExport = (format: "csv" | "json") => {
    if (patients.length === 0) {
      alert(language === "FR" ? "Aucun patient" : "No patients")
      return
    }

    let fileContent = ""
    let fileName = `patients_${new Date().toISOString().split("T")[0]}`
    let mimeType = "text/plain"

    if (format === "csv") {
      const headers = ["name", "phone", "email", "appointmentTime", "status"]
      const rows = patients.map((p) =>
        headers
          .map((h) => {
            const value = p[h as keyof Patient]
            return typeof value === "string" ? `"${value}"` : value
          })
          .join(","),
      )
      fileContent = [headers.join(","), ...rows].join("\n")
      fileName += ".csv"
      mimeType = "text/csv"
    } else {
      fileContent = JSON.stringify(patients, null, 2)
      fileName += ".json"
      mimeType = "application/json"
    }

    const blob = new Blob([fileContent], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const waitingCount = patients.filter((p) => p.status === "waiting").length
  const completedCount = patients.filter((p) => p.status === "completed").length

  return (
    <Card
      className={`shadow-lg h-full flex flex-col transition-all p-4 sm:p-6 lg:p-8 ${
        darkMode
          ? "bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600"
          : "bg-gradient-to-br from-blue-50 to-white border-blue-200"
      } border`}
    >
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <FileText className={`w-5 h-5 sm:w-6 sm:h-6 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
        <h2 className={`text-lg sm:text-2xl font-bold ${darkMode ? "text-white" : "text-blue-900"}`}>
          {t.fileManagement}
        </h2>
      </div>

      <div className="flex-1 space-y-3 sm:space-y-4 flex flex-col">
        {/* Import Section */}
        <div
          className={`p-3 sm:p-4 rounded-lg border-2 border-dashed transition ${
            darkMode
              ? "bg-slate-700 border-slate-600 hover:border-blue-500"
              : "bg-white border-blue-300 hover:border-blue-500"
          }`}
        >
          <label className="block cursor-pointer">
            <span className={`text-xs sm:text-sm font-bold mb-2 block ${darkMode ? "text-blue-400" : "text-blue-900"}`}>
              {t.importPatientData}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {t.importCSVXLSXPDF}
            </Button>
          </label>
          <p className={`text-xs mt-2 font-medium ${darkMode ? "text-slate-400" : "text-blue-600"}`}>{t.fileFormats}</p>
        </div>

        {/* Export Section */}
        <div className="space-y-2">
          <span className={`text-xs sm:text-sm font-bold block ${darkMode ? "text-blue-400" : "text-blue-900"}`}>
            {t.exportPatientData}
          </span>
          <div className="space-y-2">
            <Button
              onClick={() => handleExport("csv")}
              disabled={patients.length === 0}
              className="w-full text-sm bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {t.exportCSV}
            </Button>
            <Button
              onClick={() => handleExport("json")}
              disabled={patients.length === 0}
              className="w-full text-sm bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {t.exportJSON}
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-auto pt-3 sm:pt-4 space-y-2 sm:space-y-3">
          <div
            className={`p-3 sm:p-4 rounded-lg border ${
              darkMode ? "bg-slate-700 border-slate-600" : "bg-white border-blue-200"
            }`}
          >
            <p className={`text-xs font-medium mb-1 ${darkMode ? "text-slate-400" : "text-blue-600"}`}>
              {t.totalPatients}
            </p>
            <p className={`text-2xl sm:text-3xl font-bold ${darkMode ? "text-white" : "text-blue-900"}`}>
              {patients.length}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            <div
              className={`p-2 sm:p-3 rounded-lg ${
                darkMode
                  ? "bg-yellow-900 border border-yellow-700 text-yellow-200"
                  : "bg-yellow-100 border border-yellow-300 text-yellow-900"
              }`}
            >
              <p className="text-xs">{t.waiting}</p>
              <p className="text-lg sm:text-xl font-bold">{waitingCount}</p>
            </div>
            <div
              className={`p-2 sm:p-3 rounded-lg ${
                darkMode
                  ? "bg-green-900 border border-green-700 text-green-200"
                  : "bg-green-100 border border-green-300 text-green-900"
              }`}
            >
              <p className="text-xs">{t.completed}</p>
              <p className="text-lg sm:text-xl font-bold">{completedCount}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
