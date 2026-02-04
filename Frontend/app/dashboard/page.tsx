"use client";

import type React from "react";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Upload,
  Send,
  Plus,
  Minus,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Eye,
  Trash2,
  Phone,
  CalendarDays,
  Bell,
  MessageSquare,
  Menu,
} from "lucide-react";

interface Patient {
  _id: string;
  nomComplet: string;
  telephone: string;
  heureRendezVous: string;
  heureEstimee: string;
  termine: boolean;
  doctorId: string;
  doctorName: string;
  importFileName: string;
  importDate: string;
  statut: "en_attente" | "en_cours" | "retarde" | "termine";
  smsEnvoye: boolean;
  dateSMS?: string;
  messageSMS?: string;
  retardMinutes?: number;
  notes?: string;
}

interface FilterOptions {
  statut: string[];
  smsEnvoye: boolean | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export default function DashboardPage() {
  const {
    doctor,
    patients,
    loading,
    logout,
    fetchPatients,
    importPatients,
    sendBulkDelaySMS,
    updatePatient,
    deletePatient,
  } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentDateTime, setCurrentDateTime] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [isAdjustingTime, setIsAdjustingTime] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<
    "nomComplet" | "heureRendezVous" | "statut"
  >("heureRendezVous");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    statut: [],
    smsEnvoye: null,
    dateRange: {
      start: null,
      end: null,
    },
  });
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [showPatientDetail, setShowPatientDetail] = useState<string | null>(
    null
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!doctor) {
      router.push("/login");
      return;
    }

    if (!doctor.isActive) {
      router.push("/compte-en-attente");
      return;
    }

    if (doctor.isAdmin) {
      router.push("/dashboardAdmin");
      return;
    }

    fetchPatients();
  }, [doctor, loading, router, fetchPatients]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const time = now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentDateTime(date);
      setCurrentTime(time);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAndMarkPastAppointments = useCallback(async () => {
    const now = new Date();

    for (const patient of patients) {
      if (patient.statut === "termine") continue;

      const appointmentTime = new Date(patient.heureRendezVous);

      if (appointmentTime < now) {
        try {
          const minutesPassed = Math.max(
            0,
            Math.floor(
              (now.getTime() - appointmentTime.getTime()) / (60 * 1000)
            )
          );

          await updatePatient(patient._id, {
            statut: "termine",
            retardMinutes: minutesPassed,
            notes: patient.notes
              ? `${
                  patient.notes
                }\n[Auto] RDV terminé automatiquement le ${now.toLocaleDateString(
                  "fr-FR"
                )} à ${now.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : `[Auto] RDV terminé automatiquement le ${now.toLocaleDateString(
                  "fr-FR"
                )} à ${now.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`,
          });
        } catch (error) {
          console.error("Erreur mise à jour statut:", error);
        }
      }
    }
  }, [patients, updatePatient]);

  const checkDelayedAppointments = useCallback(async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const patient of patients) {
      if (patient.statut === "termine" || patient.statut === "retarde")
        continue;

      const appointmentTime = new Date(patient.heureRendezVous);
      const appointmentDate = new Date(
        appointmentTime.getFullYear(),
        appointmentTime.getMonth(),
        appointmentTime.getDate()
      );

      if (
        appointmentDate.getTime() === today.getTime() &&
        appointmentTime < now
      ) {
        const minutesPassed = Math.floor(
          (now.getTime() - appointmentTime.getTime()) / (60 * 1000)
        );

        if (
          minutesPassed > 0 &&
          (patient.statut === "en_attente" || patient.statut === "en_cours")
        ) {
          try {
            await updatePatient(patient._id, {
              statut: "retarde",
              retardMinutes: minutesPassed,
            });
          } catch (error) {
            console.error("Erreur mise à jour retard:", error);
          }
        }
      }
    }
  }, [patients, updatePatient]);

  useEffect(() => {
    if (patients.length === 0) return;

    const manageAppointmentStatus = async () => {
      await checkDelayedAppointments();
      await checkAndMarkPastAppointments();
    };

    manageAppointmentStatus();
    const interval = setInterval(manageAppointmentStatus, 60000);

    return () => clearInterval(interval);
  }, [patients, checkDelayedAppointments, checkAndMarkPastAppointments]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validExtensions = [".csv", ".xlsx", ".xls"];
      const fileExtension = file.name
        .toLowerCase()
        .slice(file.name.lastIndexOf("."));

      if (!validExtensions.includes(fileExtension)) {
        alert("Format non supporté. Utilisez .csv, .xlsx ou .xls");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert("Veuillez sélectionner un fichier");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await importPatients(selectedFile);

      clearInterval(progressInterval);
      setImportProgress(100);

      if (result.success) {
        alert(result.message);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setTimeout(() => {
          fetchPatients();
        }, 500);
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      alert(`Erreur d'import: ${error.message}`);
    } finally {
      setIsImporting(false);
      setTimeout(() => setImportProgress(0), 2000);
    }
  };

  const adjustAllAppointments = async (minutes: number) => {
    const now = new Date();
    const patientsToUpdate = patients.filter(
      (p) => p.statut === "en_attente" || p.statut === "en_cours"
    );

    if (patientsToUpdate.length === 0) {
      alert("Aucun rendez-vous à ajuster");
      return;
    }

    setIsAdjustingTime(true);

    try {
      const updatePromises = patientsToUpdate.map(async (patient) => {
        const appointmentTime = new Date(patient.heureRendezVous);
        const newTime = new Date(appointmentTime.getTime() + minutes * 60000);

        return updatePatient(patient._id, {
          heureRendezVous: newTime.toISOString(),
          heureEstimee: newTime.toISOString(),
          statut: newTime < now ? "retarde" : patient.statut,
        });
      });

      await Promise.all(updatePromises);

      alert(
        `Tous les rendez-vous ajustés de ${
          minutes > 0 ? "+" : ""
        }${minutes} minutes`
      );

      setTimeout(() => {
        fetchPatients();
      }, 500);
    } catch (error: any) {
      alert(`Erreur ajustement: ${error.message}`);
    } finally {
      setIsAdjustingTime(false);
    }
  };

  const handleSendBulkSMS = async () => {
    const waitingPatients = patients.filter((p) => p.statut === "en_attente");

    if (waitingPatients.length === 0) {
      alert("Aucun patient en attente pour envoyer des SMS");
      return;
    }

    setIsSendingSMS(true);

    try {
      const result = await sendBulkDelaySMS();

      if (result.success) {
        alert(result.message);
        setTimeout(() => {
          fetchPatients();
        }, 1000);
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      alert(`Erreur envoi SMS: ${error.message}`);
    } finally {
      setIsSendingSMS(false);
    }
  };

  const handleChangePatientStatus = async (
    patientId: string,
    currentStatus: string
  ) => {
    let newStatus: string;
    switch (currentStatus) {
      case "en_attente":
        newStatus = "en_cours";
        break;
      case "en_cours":
        newStatus = "termine";
        break;
      case "retarde":
        newStatus = "en_cours";
        break;
      default:
        newStatus = "en_attente";
    }

    try {
      await updatePatient(patientId, { statut: newStatus as any });
      setTimeout(() => {
        fetchPatients();
      }, 300);
    } catch (error: any) {
      alert(`Erreur changement statut: ${error.message}`);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce patient ?")) {
      try {
        const result = await deletePatient(patientId);
        if (result.success) {
          alert("Patient supprimé avec succès");
          fetchPatients();
        }
      } catch (error: any) {
        alert(`Erreur suppression: ${error.message}`);
      }
    }
  };

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatients((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(filteredPatients.map((p) => p._id));
    }
  };

  const filteredPatients = useMemo(() => {
    return patients
      .filter((patient) => {
        const matchesSearch =
          searchTerm === "" ||
          patient.nomComplet.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.telephone.includes(searchTerm);

        const matchesStatus =
          filters.statut.length === 0 ||
          filters.statut.includes(patient.statut);

        const matchesSMS =
          filters.smsEnvoye === null || patient.smsEnvoye === filters.smsEnvoye;

        const appointmentDate = new Date(patient.heureRendezVous);
        const matchesDateRange =
          (!filters.dateRange.start ||
            appointmentDate >= filters.dateRange.start) &&
          (!filters.dateRange.end || appointmentDate <= filters.dateRange.end);

        return matchesSearch && matchesStatus && matchesSMS && matchesDateRange;
      })
      .sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
          case "nomComplet":
            aValue = a.nomComplet.toLowerCase();
            bValue = b.nomComplet.toLowerCase();
            break;
          case "statut":
            aValue = a.statut;
            bValue = b.statut;
            break;
          default:
            aValue = new Date(a.heureRendezVous).getTime();
            bValue = new Date(b.heureRendezVous).getTime();
        }

        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  }, [patients, searchTerm, filters, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  const stats = {
    total: patients.length,
    enAttente: patients.filter((p) => p.statut === "en_attente").length,
    enCours: patients.filter((p) => p.statut === "en_cours").length,
    retarde: patients.filter((p) => p.statut === "retarde").length,
    termine: patients.filter((p) => p.statut === "termine").length,
    smsEnvoye: patients.filter((p) => p.smsEnvoye).length,
    selected: selectedPatients.length,
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "en_cours":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "retarde":
        return "bg-red-100 text-red-800 border-red-200";
      case "termine":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!doctor || !doctor.isActive || doctor.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                Doc Notification
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Dr. {doctor.nomComplet}
              </span>
              <button
                onClick={fetchPatients}
                disabled={loading}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Déconnexion
              </button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-xs text-gray-600 font-medium mb-1">TOTAL</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <Users className="w-5 h-5 text-gray-400 mt-2" />
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-yellow-200">
            <p className="text-xs text-yellow-600 font-medium mb-1">
              EN ATTENTE
            </p>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.enAttente}
            </p>
            <Clock className="w-5 h-5 text-yellow-500 mt-2" />
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
            <p className="text-xs text-blue-600 font-medium mb-1">EN COURS</p>
            <p className="text-2xl font-bold text-blue-600">{stats.enCours}</p>
            <Bell className="w-5 h-5 text-blue-500 mt-2" />
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-red-200">
            <p className="text-xs text-red-600 font-medium mb-1">RETARDÉS</p>
            <p className="text-2xl font-bold text-red-600">{stats.retarde}</p>
            <AlertCircle className="w-5 h-5 text-red-500 mt-2" />
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
            <p className="text-xs text-green-600 font-medium mb-1">TERMINÉS</p>
            <p className="text-2xl font-bold text-green-600">{stats.termine}</p>
            <CheckCircle className="w-5 h-5 text-green-500 mt-2" />
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
            <p className="text-xs text-purple-600 font-medium mb-1">
              SMS ENVOYÉS
            </p>
            <p className="text-2xl font-bold text-purple-600">
              {stats.smsEnvoye}
            </p>
            <Send className="w-5 h-5 text-purple-500 mt-2" />
          </div>
        </div>
        <div className="mb-8">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* 1️⃣ Heure actuelle */}
              <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 text-white">
                <p className="text-sm opacity-80 mb-3">Heure actuelle</p>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white/20">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-widest">
                      {currentTime}
                    </div>
                    <div className="text-sm opacity-80 mt-1">
                      {currentDateTime}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2️⃣ Ajuster horaires */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-4">
                  Ajuster les horaires
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => adjustAllAppointments(-5)}
                    disabled={isAdjustingTime}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />5 min
                  </button>

                  <button
                    onClick={() => adjustAllAppointments(5)}
                    disabled={isAdjustingTime}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />5 min
                  </button>
                </div>
              </div>

              {/* 3️⃣ SMS */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      SMS patients
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {stats.enAttente} en attente
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                </div>

                <button
                  onClick={handleSendBulkSMS}
                  disabled={isSendingSMS || stats.enAttente === 0}
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition disabled:opacity-50"
                >
                  {isSendingSMS ? "Envoi..." : "Notifier"}
                </button>
              </div>

              {/* 4️⃣ Import */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Import patients
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">CSV, XLSX</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                <label
                  htmlFor="file-upload"
                  className="block p-4 text-center border-2 border-dashed rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer mb-3"
                >
                  <p className="text-sm text-gray-600">
                    {selectedFile ? selectedFile.name : "Choisir un fichier"}
                  </p>
                </label>

                {importProgress > 0 && (
                  <div className="mb-3">
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-blue-600 rounded-full transition-all"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
                >
                  {isImporting ? "Import..." : "Importer"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border font-medium flex items-center gap-2 whitespace-nowrap ${
                showFilters
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtres
              {Object.values(filters).some((v) =>
                Array.isArray(v) ? v.length > 0 : v !== null
              ) && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Statut
                  </label>
                  <div className="space-y-2">
                    {["en_attente", "en_cours", "retarde", "termine"].map(
                      (statut) => (
                        <label key={statut} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.statut.includes(statut)}
                            onChange={(e) => {
                              setFilters((prev) => ({
                                ...prev,
                                statut: e.target.checked
                                  ? [...prev.statut, statut]
                                  : prev.statut.filter((s) => s !== statut),
                              }));
                            }}
                            className="rounded border-gray-300 text-blue-600"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">
                            {statut.replace("_", " ")}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    SMS
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="smsFilter"
                        checked={filters.smsEnvoye === null}
                        onChange={() =>
                          setFilters((prev) => ({ ...prev, smsEnvoye: null }))
                        }
                        className="border-gray-300 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Tous</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="smsFilter"
                        checked={filters.smsEnvoye === true}
                        onChange={() =>
                          setFilters((prev) => ({ ...prev, smsEnvoye: true }))
                        }
                        className="border-gray-300 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Envoyés
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="smsFilter"
                        checked={filters.smsEnvoye === false}
                        onChange={() =>
                          setFilters((prev) => ({
                            ...prev,
                            smsEnvoye: false,
                          }))
                        }
                        className="border-gray-300 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Non envoyés
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col justify-end gap-2">
                  <button
                    onClick={() =>
                      setFilters({
                        statut: [],
                        smsEnvoye: null,
                        dateRange: { start: null, end: null },
                      })
                    }
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    Réinitialiser
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Table header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Rendez vous du Jour
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredPatients.length} patient(s) trouvé(s)
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    Afficher
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    par page
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="heureRendezVous">Heure RDV</option>
                    <option value="nomComplet">Nom</option>
                    <option value="statut">Statut</option>
                  </select>
                  <button
                    onClick={() =>
                      setSortDirection((prev) =>
                        prev === "asc" ? "desc" : "asc"
                      )
                    }
                    className="px-2 py-1 hover:bg-gray-200 rounded text-gray-700"
                  >
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto w-12 h-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Aucun patient trouvé
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm || showFilters
                  ? "Aucun résultat pour vos critères"
                  : "Importez un fichier pour commencer"}
              </p>
            </div>
          ) : (
            <>
              {/* Table - responsive */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-white">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedPatients.length ===
                              filteredPatients.length &&
                            filteredPatients.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-blue-600"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">
                        Patient
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 hidden sm:table-cell">
                        Téléphone
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">
                        RDV
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 hidden sm:table-cell">
                        SMS
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentPatients.map((patient) => {
                      const appointmentDate = new Date(patient.heureRendezVous);
                      const now = new Date();
                      const isToday =
                        appointmentDate.toDateString() === now.toDateString();
                      const isPast = appointmentDate < now;

                      return (
                        <tr
                          key={patient._id}
                          className={`hover:bg-gray-50 transition-colors ${
                            selectedPatients.includes(patient._id)
                              ? "bg-blue-50"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedPatients.includes(patient._id)}
                              onChange={() =>
                                togglePatientSelection(patient._id)
                              }
                              className="rounded border-gray-300 text-blue-600"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">
                              {patient.nomComplet}
                            </p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                {patient.telephone}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">
                                {formatTime(patient.heureRendezVous)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {appointmentDate.toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                                {isToday && (
                                  <span className="ml-1 text-blue-600 font-medium">
                                    (Auj.)
                                  </span>
                                )}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                                patient.statut
                              )}`}
                            >
                              {patient.statut.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {patient.smsEnvoye ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-gray-400" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleChangePatientStatus(
                                    patient._id,
                                    patient.statut
                                  )
                                }
                                className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                {patient.statut === "en_attente"
                                  ? "Démarrer"
                                  : patient.statut === "en_cours"
                                  ? "Fin"
                                  : "Reprendre"}
                              </button>
                              <button
                                onClick={() =>
                                  setShowPatientDetail(patient._id)
                                }
                                className="p-1 text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePatient(patient._id)}
                                className="p-1 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  {startIndex + 1} à{" "}
                  {Math.min(endIndex, filteredPatients.length)} sur{" "}
                  {filteredPatients.length}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-2 py-1 rounded text-sm ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Patient detail modal */}
      {showPatientDetail && (
        <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Détails du Patient
                </h3>
                <button
                  onClick={() => setShowPatientDetail(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {(() => {
                const patient = patients.find(
                  (p) => p._id === showPatientDetail
                );
                if (!patient) return null;

                const appointmentDate = new Date(patient.heureRendezVous);
                const now = new Date();
                const isPast = appointmentDate < now;
                const isToday =
                  appointmentDate.toDateString() === now.toDateString();

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3">
                          Infos Personnelles
                        </h4>
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">Nom</p>
                              <p className="font-medium text-gray-900">
                                {patient.nomComplet}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">Téléphone</p>
                              <p className="font-medium text-gray-900">
                                {patient.telephone}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3">
                          Rendez-vous
                        </h4>
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <CalendarDays className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">Heure RDV</p>
                              <p className="font-medium text-gray-900">
                                {formatDate(patient.heureRendezVous)}
                              </p>
                              {isToday && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Aujourd'hui
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-3">
                        Statut
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                            patient.statut
                          )}`}
                        >
                          {patient.statut.replace("_", " ")}
                        </span>
                        {patient.smsEnvoye && (
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            SMS Envoyé
                          </span>
                        )}
                      </div>
                    </div>

                    {patient.notes && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">
                          Notes
                        </h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap text-sm">
                          {patient.notes}
                        </p>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-4 flex gap-2">
                      <button
                        onClick={() => {
                          handleChangePatientStatus(
                            patient._id,
                            patient.statut
                          );
                          setShowPatientDetail(null);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Mettre à jour statut
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(patient.telephone);
                          alert("Numéro copié");
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                      >
                        Copier n°
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
