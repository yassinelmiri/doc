'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Doctor {
  _id: string
  nomComplet: string
  email: string
  address: string
  postalCode: string
  city: string
  specialties: string[]
  isActive: boolean
  isAdmin: boolean
  [key: string]: any
}

interface Patient {
  _id: string
  nomComplet: string
  telephone: string
  heureRendezVous: string
  heureEstimee: string
  termine: boolean
  doctorId: string
  doctorName: string
  importFileName: string
  importDate: string
  statut: 'en_attente' | 'en_cours' | 'retarde' | 'termine'
  smsEnvoye: boolean
  dateSMS?: string
  messageSMS?: string
  retardMinutes?: number
  notes?: string
}

interface AuthContextType {
  doctor: Doctor | null
  patients: Patient[]
  loading: boolean
  error: string
  login: (email: string, password: string) => Promise<void>
  register: (
    nomComplet: string, 
    email: string, 
    password: string, 
    additionalData: any
  ) => Promise<void>
  logout: () => void
  fetchPatients: () => Promise<void>
  importPatients: (file: File) => Promise<{ success: boolean; message: string; data?: Patient[] }>
  exportPatients: (format: 'csv' | 'excel') => Promise<void>
  sendBulkDelaySMS: () => Promise<{ success: boolean; message: string; data?: any }>
  sendSMS: (patientId: string, message?: string) => Promise<{ success: boolean; message: string }>
  updatePatient: (patientId: string, data: Partial<Patient>) => Promise<{ success: boolean; message: string }>
  deletePatient: (patientId: string) => Promise<{ success: boolean; message: string }>
  checkUserStatusAndRedirect: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false) // Nouvel état
  const router = useRouter()

  // Fonction pour vérifier le statut et rediriger
  const checkUserStatusAndRedirect = useCallback(() => {
    if (!doctor) {
      router.push('/login')
      return
    }

    if (!doctor.isActive) {
      router.push('/compte-en-attente')
      return
    }

    if (doctor.isAdmin) {
      router.push('/dashboardAdmin')
    } else {
      router.push('/dashboard')
    }
  }, [doctor, router])

  // Vérifier l'authentification au chargement - VERSION CORRIGÉE
  useEffect(() => {
    const checkAuth = async () => {
      // Éviter de vérifier plusieurs fois
      if (hasCheckedAuth) return
      
      try {
        const token = localStorage.getItem('token')
        const doctorData = localStorage.getItem('doctor')
        
        if (token && doctorData) {
          const parsedDoctor = JSON.parse(doctorData)
          setDoctor(parsedDoctor)
          
          // Marquer comme vérifié
          setHasCheckedAuth(true)
        } else {
          setHasCheckedAuth(true)
        }
      } catch (error) {
        console.error('Erreur vérification auth:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('doctor')
        setHasCheckedAuth(true)
      }
    }
    
    checkAuth()
  }, [hasCheckedAuth]) // Seulement dépend de hasCheckedAuth

  // Login - version corrigée
  const login = async (email: string, password: string) => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_URL}/api/doctors/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur de connexion')
      }
      
      let doctorData: Doctor
      let token: string
      
      if (data.data && data.data.token) {
        token = data.data.token
        doctorData = data.data.doctor || data.data
      } else if (data.token) {
        token = data.token
        doctorData = data.doctor || data
      } else {
        throw new Error('Structure de réponse invalide')
      }
      
      localStorage.setItem('token', token)
      localStorage.setItem('doctor', JSON.stringify(doctorData))
      setDoctor(doctorData)
      
      // Rediriger selon le statut
      if (!doctorData.isActive) {
        router.push('/compte-en-attente')
      } else if (doctorData.isAdmin) {
        router.push('/dashboardAdmin')
      } else {
        router.push('/dashboard')
      }
      
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Register
  const register = async (nomComplet: string, email: string, password: string, additionalData: any) => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_URL}/api/doctors/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomComplet,
          email,
          password,
          ...additionalData
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur d\'inscription')
      }
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('doctor', JSON.stringify(data.doctor))
      setDoctor(data.doctor)
      
      router.push('/compte-en-attente')
      
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('doctor')
    setDoctor(null)
    setPatients([])
    setHasCheckedAuth(false) // Réinitialiser
    router.push('/login')
  }

  // Fetch patients - version avec useCallback pour éviter les boucles
  const fetchPatients = useCallback(async () => {
    setLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      const doctorData = localStorage.getItem('doctor')
      
      if (!token || !doctorData) {
        setPatients([])
        return
      }
      
      const response = await fetch(`${API_URL}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 404 || response.status === 204) {
        setPatients([])
        return
      }

      if (!response.ok) {
        try {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Erreur récupération patients')
        } catch {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`)
        }
      }

      const data = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        setPatients(data.data)
      } else if (Array.isArray(data)) {
        setPatients(data)
      } else {
        setPatients([])
      }
      
    } catch (error: any) {
      console.error('Erreur fetch patients:', error)
      if (!error.message.includes('404')) {
        setError(error.message)
      }
      setPatients([])
    } finally {
      setLoading(false)
    }
  }, []) // Pas de dépendances

  // Import patients
  const importPatients = async (file: File): Promise<{ success: boolean; message: string; data?: Patient[] }> => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${API_URL}/api/patients/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur import')
      }
      
      // Rafraîchir les patients
      await fetchPatients()
      
      return {
        success: true,
        message: data.message,
        data: data.data
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      }
    } finally {
      setLoading(false)
    }
  }

  // Export patients
  const exportPatients = async (format: 'csv' | 'excel') => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/patients/export/${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Erreur export')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `patients_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Erreur export:', error)
      throw error
    }
  }

  // Send bulk delay SMS
  const sendBulkDelaySMS = async (): Promise<{ success: boolean; message: string; data?: any }> => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/patients/sms/delay-bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur envoi SMS')
      }
      
      await fetchPatients()
      
      return {
        success: true,
        message: data.message,
        data: data.data
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      }
    } finally {
      setLoading(false)
    }
  }

  // Send SMS to single patient
  const sendSMS = async (patientId: string, message?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/patients/${patientId}/sms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur envoi SMS')
      }
      
      await fetchPatients()
      
      return {
        success: true,
        message: data.message
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      }
    }
  }

  // Update patient
  const updatePatient = async (patientId: string, data: Partial<Patient>): Promise<{ success: boolean; message: string }> => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Erreur mise à jour')
      }
      
      await fetchPatients()
      
      return {
        success: true,
        message: responseData.message
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      }
    }
  }

  // Delete patient
  const deletePatient = async (patientId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/patients/${patientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur suppression')
      }
      
      await fetchPatients()
      
      return {
        success: true,
        message: data.message
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      }
    }
  }

  const value = {
    doctor,
    patients,
    loading: loading || !hasCheckedAuth, // Inclure le chargement de vérification
    error,
    login,
    register,
    logout,
    fetchPatients,
    importPatients,
    exportPatients,
    sendBulkDelaySMS,
    sendSMS,
    updatePatient,
    deletePatient,
    checkUserStatusAndRedirect
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}