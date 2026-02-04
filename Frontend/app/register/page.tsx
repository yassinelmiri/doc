'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  AlertCircle,
  Stethoscope,
  MapPin,
  Hash,
  Building2,
  Plus,
  X
} from 'lucide-react'

type FormData = {
  nomComplet: string
  email: string
  address: string
  postalCode: string
  city: string
  password: string
  confirmPassword: string
  specialties: string[]
}

type InputProps = {
  label: string
  icon: React.ReactNode
  name: keyof FormData
  type?: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}

type PasswordInputProps = {
  label: string
  name: keyof FormData
  value: string
  show: boolean
  toggle: () => void
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}

export default function RegisterPage() {
  const { register } = useAuth()

  const [form, setForm] = useState<FormData>({
    nomComplet: '',
    email: '',
    address: '',
    postalCode: '',
    city: '',
    password: '',
    confirmPassword: '',
    specialties: []
  })

  const [specialtyInput, setSpecialtyInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const addSpecialty = () => {
    if (specialtyInput.trim() && !form.specialties.includes(specialtyInput)) {
      setForm(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialtyInput.trim()]
      }))
      setSpecialtyInput('')
    }
  }

  const removeSpecialty = (spec: string) => {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== spec)
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setIsLoading(true)

    try {
      await register(
        form.nomComplet,
        form.email,
        form.password,
        {
          address: form.address,
          postalCode: form.postalCode,
          city: form.city,
          specialties: form.specialties
        }
      )
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Erreur lors de l\'inscription')
      } else {
        setError('Erreur lors de l\'inscription')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Stethoscope className="text-white w-8 h-8" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Inscription Médecin
          </h1>
          <p className="text-gray-600">
            Créez votre compte professionnel
          </p>
        </div>

        {/* FORM */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border">
          <form onSubmit={handleSubmit} className="space-y-5">

            {error && (
              <div className="flex gap-2 bg-red-50 text-red-700 p-3 rounded-lg border border-red-200">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* NOM */}
            <Input 
              label="Nom complet" 
              icon={<User />} 
              name="nomComplet" 
              value={form.nomComplet} 
              onChange={handleChange}
              placeholder="Dr. Jean Dupont"
            />

            {/* EMAIL */}
            <Input 
              label="Email" 
              icon={<Mail />} 
              name="email" 
              type="email" 
              value={form.email} 
              onChange={handleChange}
              placeholder="jean.dupont@example.com"
            />

            {/* ADDRESS */}
            <Input 
              label="Adresse" 
              icon={<MapPin />} 
              name="address" 
              value={form.address} 
              onChange={handleChange}
              placeholder="123 Rue de la Médecine"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Code postal" 
                icon={<Hash />} 
                name="postalCode" 
                value={form.postalCode} 
                onChange={handleChange}
                placeholder="75000"
              />
              <Input 
                label="Ville" 
                icon={<Building2 />} 
                name="city" 
                value={form.city} 
                onChange={handleChange}
                placeholder="Paris"
              />
            </div>

            {/* SPECIALTIES */}
            <div>
              <label className="block text-sm font-medium mb-2">Spécialités</label>
              <div className="flex gap-2">
                <input
                  value={specialtyInput}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSpecialtyInput(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Ex: Cardiologie"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSpecialty()
                    }
                  }}
                />
                <button 
                  type="button" 
                  onClick={addSpecialty} 
                  className="bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {form.specialties.map(spec => (
                  <span key={spec} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2">
                    {spec}
                    <button 
                      type="button" 
                      onClick={() => removeSpecialty(spec)}
                      className="hover:text-blue-900"
                      aria-label={`Supprimer ${spec}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* PASSWORD */}
            <PasswordInput
              label="Mot de passe"
              name="password"
              value={form.password}
              show={showPassword}
              toggle={() => setShowPassword(!showPassword)}
              onChange={handleChange}
              placeholder="••••••••"
            />

            {/* CONFIRM PASSWORD */}
            <PasswordInput
              label="Confirmer le mot de passe"
              name="confirmPassword"
              value={form.confirmPassword}
              show={showConfirmPassword}
              toggle={() => setShowConfirmPassword(!showConfirmPassword)}
              onChange={handleChange}
              placeholder="••••••••"
            />

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Inscription...' : "S'inscrire"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Déjà un compte ?
            <Link href="/login" className="text-blue-600 font-semibold ml-1 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ================= COMPONENTS ================= */

function Input({ label, icon, type = 'text', name, value, onChange, placeholder }: InputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" htmlFor={name}>
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-3 text-gray-400">{icon}</div>
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          required
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

function PasswordInput({ label, name, value, show, toggle, onChange, placeholder }: PasswordInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" htmlFor={name}>
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-3 text-gray-400" />
        <input
          id={name}
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          required
          placeholder={placeholder}
        />
        <button 
          type="button" 
          onClick={toggle} 
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          aria-label={show ? "Cacher le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}