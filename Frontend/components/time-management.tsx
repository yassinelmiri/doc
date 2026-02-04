"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Minus, Clock } from "lucide-react"
import type { Patient, Language } from "./doctor-dashboard"

interface TimeManagementProps {
  currentTime: number
  onTimeChange: (time: number) => void
  onFinishPatient: () => void
  currentPatient: Patient | null
  darkMode: boolean
  language: Language
}

const translations = {
  FR: {
    timeManagement: "Gestion du Temps",
    currentTime: "Heure Actuelle",
    minutes: "min",
    remaining: "restantes",
    timeUp: "Temps écoulé",
    addMin: "+1 min",
    removeMin: "-1 min",
    start: "Démarrer",
    pause: "Pause",
    finish: "Terminer",
    reset: "Réinitialiser",
    exceeded: "Dépassé",
    lastMinutes: "Dernières min",
    inSession: "Actif",
  },
  ENG: {
    timeManagement: "Time Management",
    currentTime: "Current Time",
    minutes: "min",
    remaining: "remaining",
    timeUp: "Time up",
    addMin: "+1 min",
    removeMin: "-1 min",
    start: "Start",
    pause: "Pause",
    finish: "Finish",
    reset: "Reset",
    exceeded: "Exceeded",
    lastMinutes: "Final min",
    inSession: "Active",
  },
}

export function TimeManagement({
  currentTime,
  onTimeChange,
  onFinishPatient,
  currentPatient,
  darkMode,
  language,
}: TimeManagementProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date())
  const t = translations[language]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      onTimeChange((prev) => (prev < 30 ? prev + 1 : 30))
    }, 60000) // 1 minute real time

    return () => clearInterval(interval)
  }, [isRunning, onTimeChange])

  const remainingTime = 30 - currentTime
  const progress = (currentTime / 30) * 100
  const isWarning = currentTime >= 25
  const isComplete = currentTime >= 30

  const timeString = currentDateTime.toLocaleTimeString(language === "FR" ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const dateString = currentDateTime.toLocaleDateString(language === "FR" ? "fr-FR" : "en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <Card
      className={`shadow-lg h-full flex flex-col transition-all p-4 sm:p-6 lg:p-8 ${
        darkMode
          ? "bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600"
          : "bg-gradient-to-br from-blue-50 to-white border-blue-200"
      } border`}
    >
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Clock className={`w-5 h-5 sm:w-6 sm:h-6 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
        <h2 className={`text-lg sm:text-2xl font-bold ${darkMode ? "text-white" : "text-blue-900"}`}>
          {t.timeManagement}
        </h2>
      </div>

      <div
        className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${
          darkMode ? "bg-slate-700 border-slate-600" : "bg-white border-blue-100"
        }`}
      >
        <p className={`text-xs sm:text-sm font-medium mb-1 ${darkMode ? "text-slate-400" : "text-blue-600"}`}>
          {t.currentTime}
        </p>
        <p className={`text-2xl sm:text-3xl font-bold font-mono ${darkMode ? "text-white" : "text-blue-900"}`}>
          {timeString}
        </p>
        <p className={`text-xs mt-2 capitalize ${darkMode ? "text-slate-400" : "text-blue-600"}`}>{dateString}</p>
      </div>

      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle cx="50" cy="50" r="45" fill="none" stroke={darkMode ? "#334155" : "#dbeafe"} strokeWidth="8" />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={isComplete ? "#ef4444" : isWarning ? "#f97316" : "#2563eb"}
              strokeWidth="8"
              strokeDasharray={`${(2 * Math.PI * 45 * progress) / 100} ${2 * Math.PI * 45}`}
              className="transition-all duration-300"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-3xl sm:text-4xl font-bold ${darkMode ? "text-white" : "text-blue-900"}`}>
              {currentTime}
            </div>
            <div className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-blue-600"}`}>
              / 30 {t.minutes}
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="text-center mb-4 sm:mb-6">
        <span
          className={`inline-block px-3 sm:px-4 py-1 sm:py-2 rounded-full font-semibold text-white text-xs sm:text-sm ${
            isComplete ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-green-500"
          }`}
        >
          {isComplete ? t.exceeded : isWarning ? t.lastMinutes : t.inSession}
        </span>
        <p className={`text-xs sm:text-sm mt-2 sm:mt-3 font-medium ${darkMode ? "text-slate-400" : "text-blue-600"}`}>
          {remainingTime > 0 ? `${remainingTime} ${t.remaining}` : t.timeUp}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
        <Button
          onClick={() => onTimeChange(Math.max(0, currentTime - 1))}
          disabled={isRunning}
          className={`text-sm sm:text-base ${
            darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-blue-100 hover:bg-blue-200 text-blue-900"
          } font-semibold`}
        >
          <Minus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          <span className="hidden xs:inline">{t.removeMin}</span>
        </Button>
        <Button
          onClick={() => onTimeChange(currentTime + 1)}
          disabled={isRunning}
          className={`text-sm sm:text-base ${
            darkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-blue-100 hover:bg-blue-200 text-blue-900"
          } font-semibold`}
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          <span className="hidden xs:inline">{t.addMin}</span>
        </Button>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <Button
          onClick={() => setIsRunning(!isRunning)}
          className={`w-full text-sm sm:text-base font-semibold text-white transition-all ${
            isRunning ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isRunning ? t.pause : t.start}
        </Button>
        <Button
          onClick={onFinishPatient}
          className="w-full text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          {t.finish}
        </Button>
        <Button
          onClick={() => onTimeChange(0)}
          variant="outline"
          className={`w-full text-sm sm:text-base font-semibold ${
            darkMode
              ? "border-slate-600 text-slate-400 hover:bg-slate-700"
              : "text-blue-700 border-blue-300 hover:bg-blue-50"
          }`}
        >
          {t.reset}
        </Button>
      </div>
    </Card>
  )
}
