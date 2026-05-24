/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Search, 
  Home, 
  FileText, 
  Download, 
  Copy, 
  Printer, 
  ArrowLeft, 
  Trash2, 
  Edit, 
  Check, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  Phone,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  X,
  CreditCard,
  Hash
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPng } from "html-to-image";
import { ConsultationRecord } from "./types";
import { 
  getRecords, 
  saveRecord, 
  deleteRecord, 
  formatCPF, 
  formatRG, 
  formatWhatsapp, 
  formatEleitorTitulo, 
  formatDateBr,
  formatCEP
} from "./utils";

const INITIAL_FORM_STATE = {
  pacienteNome: "",
  pacienteCpf: "",
  pacienteRg: "",
  pacienteWhatsapp: "",
  pacienteEndereco: "",
  pacienteCep: "",
  pacienteRua: "",
  pacienteNumero: "",
  pacienteCidade: "",
  pacienteEstado: "",
  consultaData: "",
  consultaHorario: "",
  consultaEndereco: "",
  profissionalNome: "",
  profissionalCargo: "",
  eleitorTitulo: "",
  eleitorZona: "",
  eleitorSecao: ""
};

export default function App() {
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  const [currentView, setCurrentView] = useState<"list" | "form" | "preview">("form");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [formData, setFormData] = useState<typeof INITIAL_FORM_STATE>(INITIAL_FORM_STATE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ConsultationRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const previewRef = useRef<HTMLDivElement>(null);

  // Load records initially
  useEffect(() => {
    setRecords(getRecords());
  }, []);

  // Show status toasts
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // ViaCEP lookup integration
  const fetchAddressFromCep = async (cep: string) => {
    try {
      triggerToast("🔍 Buscando CEP...");
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!res.ok) throw new Error("CEP inválido");
      const data = await res.json();
      if (data.erro) {
        triggerToast("⚠️ CEP não encontrado!");
        return;
      }
      setFormData(prev => ({
        ...prev,
        pacienteRua: data.logradouro || "",
        pacienteCidade: data.localidade || "",
        pacienteEstado: data.uf || ""
      }));
      triggerToast("✨ Endereço preenchido automaticamente!");
    } catch (err) {
      console.error(err);
      triggerToast("❌ Erro ao buscar CEP");
    }
  };

  // Pre-fill fields with realistic sample data for fast testing
  const handleAutofillMockData = () => {
    setFormData({
      pacienteNome: "Francisca Maria de Sousa",
      pacienteCpf: "123.456.789-00",
      pacienteRg: "12.345.678-X",
      pacienteWhatsapp: "(85) 98765-4321",
      pacienteEndereco: "Rua Floriano Peixoto, 450 - Centro, Fortaleza/CE",
      pacienteCep: "60025-000",
      pacienteRua: "Rua Floriano Peixoto",
      pacienteNumero: "450",
      pacienteCidade: "Fortaleza",
      pacienteEstado: "CE",
      consultaData: "2026-05-28",
      consultaHorario: "14:30",
      consultaEndereco: "Policlínica Central de Fortaleza, Av. Santos Dumont, 1200 - Aldeota",
      profissionalNome: "Dra. Juliana Mendes",
      profissionalCargo: "Ginecologista & Obstetra",
      eleitorTitulo: "0987 6543 2101",
      eleitorZona: "042",
      eleitorSecao: "0128"
    });
    triggerToast("✨ Dados de teste preenchidos!");
  };

  // Reset form
  const handleClearForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setEditingId(null);
    triggerToast("🧹 Formulário limpo!");
  };

  // Change views
  const navigateToCreate = () => {
    setFormData(INITIAL_FORM_STATE);
    setEditingId(null);
    setCurrentView("form");
  };

  const navigateToHome = () => {
    setRecords(getRecords());
    setCurrentView("list");
    setSelectedRecord(null);
  };

  const navigateToEdit = (record: ConsultationRecord) => {
    setFormData({
      pacienteNome: record.pacienteNome,
      pacienteCpf: record.pacienteCpf,
      pacienteRg: record.pacienteRg,
      pacienteWhatsapp: record.pacienteWhatsapp,
      pacienteEndereco: record.pacienteEndereco || "",
      pacienteCep: record.pacienteCep || "",
      pacienteRua: record.pacienteRua || "",
      pacienteNumero: record.pacienteNumero || "",
      pacienteCidade: record.pacienteCidade || "",
      pacienteEstado: record.pacienteEstado || "",
      consultaData: record.consultaData,
      consultaHorario: record.consultaHorario,
      consultaEndereco: record.consultaEndereco,
      profissionalNome: record.profissionalNome,
      profissionalCargo: record.profissionalCargo,
      eleitorTitulo: record.eleitorTitulo,
      eleitorZona: record.eleitorZona,
      eleitorSecao: record.eleitorSecao
    });
    setEditingId(record.id);
    setCurrentView("form");
  };

  const viewRecordDetails = (record: ConsultationRecord) => {
    setSelectedRecord(record);
    setCurrentView("preview");
  };

  // Form input changes with onthefly masks
  const handleInputChange = (field: keyof typeof INITIAL_FORM_STATE, val: string) => {
    let formatted = val;
    if (field === "pacienteCpf") {
      formatted = formatCPF(val);
    } else if (field === "pacienteRg") {
      formatted = formatRG(val);
    } else if (field === "pacienteWhatsapp") {
      formatted = formatWhatsapp(val);
    } else if (field === "eleitorTitulo") {
      formatted = formatEleitorTitulo(val);
    } else if (field === "pacienteCep") {
      formatted = formatCEP(val);
      const rawDigits = formatted.replace(/\D/g, "");
      if (rawDigits.length === 8) {
        fetchAddressFromCep(rawDigits);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formatted
    }));
  };

  // Save entry
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation for required fields
    if (!formData.pacienteNome || !formData.consultaData || !formData.profissionalNome) {
      alert("Por favor, preencha os campos obrigatórios (*): Nome da Paciente, Data da Consulta e Nome da Profissional.");
      return;
    }

    // Generate combined address if separated ones were given
    let addressString = formData.pacienteEndereco || "";
    if (formData.pacienteRua) {
      addressString = `${formData.pacienteRua}`;
      if (formData.pacienteNumero) addressString += `, ${formData.pacienteNumero}`;
      if (formData.pacienteCidade) addressString += ` - ${formData.pacienteCidade}`;
      if (formData.pacienteEstado) addressString += ` / ${formData.pacienteEstado}`;
      if (formData.pacienteCep) addressString += ` (CEP: ${formData.pacienteCep})`;
    }

    const id = editingId || "ctc-" + Date.now();
    const newRecord: ConsultationRecord = {
      id,
      pacienteNome: formData.pacienteNome,
      pacienteCpf: formData.pacienteCpf,
      pacienteRg: formData.pacienteRg,
      pacienteWhatsapp: formData.pacienteWhatsapp,
      pacienteEndereco: addressString,
      pacienteCep: formData.pacienteCep,
      pacienteRua: formData.pacienteRua,
      pacienteNumero: formData.pacienteNumero,
      pacienteCidade: formData.pacienteCidade,
      pacienteEstado: formData.pacienteEstado,
      consultaData: formData.consultaData,
      consultaHorario: formData.consultaHorario,
      consultaEndereco: formData.consultaEndereco,
      profissionalNome: formData.profissionalNome,
      profissionalCargo: formData.profissionalCargo,
      eleitorTitulo: formData.eleitorTitulo,
      eleitorZona: formData.eleitorZona,
      eleitorSecao: formData.eleitorSecao,
      createdAt: new Date().toISOString()
    };

    const updatedRecords = saveRecord(newRecord);
    setRecords(updatedRecords);
    setSelectedRecord(newRecord);
    setEditingId(null);
    setCurrentView("preview");
    triggerToast("💾 Registro salvo com sucesso no banco!");
  };

  // Delete entry
  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm("Deseja realmente remover este registro permanentemente do banco?")) {
      const updated = deleteRecord(id);
      setRecords(updated);
      triggerToast("🗑️ Registro excluído.");
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
        setCurrentView("list");
      }
    }
  };

  // Get filtered records list
  const filteredRecords = records.filter(record => {
    const query = searchQuery.toLowerCase();
    const matchesName = record.pacienteNome.toLowerCase().includes(query) || 
                        record.profissionalNome.toLowerCase().includes(query) || 
                        (record.profissionalCargo && record.profissionalCargo.toLowerCase().includes(query));
    const matchesDate = searchDate ? record.consultaData === searchDate : true;
    return matchesName && matchesDate;
  });

  // Copia rápida de texto
  const getShareableText = (record: ConsultationRecord): string => {
    let patientAddr = record.pacienteEndereco || "";
    if (record.pacienteRua) {
      patientAddr = `${record.pacienteRua}`;
      if (record.pacienteNumero) patientAddr += `, ${record.pacienteNumero}`;
      if (record.pacienteCidade) patientAddr += ` - ${record.pacienteCidade}`;
      if (record.pacienteEstado) patientAddr += ` / ${record.pacienteEstado}`;
      if (record.pacienteCep) patientAddr += ` (CEP: ${record.pacienteCep})`;
    }
    patientAddr = patientAddr || "Não informado";

    return `📝 *CTC CONSULTAS / CONFIRMAÇÃO* 📝

Olá! Seguem os dados de confirmação da consulta agendada:

👤 *PACIENTE:* ${record.pacienteNome || "Não informado"}
📱 *WHATSAPP:* ${record.pacienteWhatsapp || "Não informado"}
💳 *CPF:* ${record.pacienteCpf || "Não informado"} | *RG:* ${record.pacienteRg || "Não informado"}
🗳️ *TÍTULO DE ELEITOR:* ${record.eleitorTitulo || "Não informado"}
📍 *ZONA / SEÇÃO:* Zona ${record.eleitorZona || "-"} / Secão ${record.eleitorSecao || "-"}
🏡 *ENDEREÇO DA PACIENTE:* ${patientAddr}

🏥 *DETALHES DA CONSULTA:*
👩‍⚕️ *PROFISSIONAL:* ${record.profissionalNome} ${record.profissionalCargo ? `(${record.profissionalCargo})` : ""}
📅 *DATA:* ${formatDateBr(record.consultaData)}
⏰ *HORÁRIO:* ${record.consultaHorario || "Não informado"}
📍 *ENDEREÇO DA CONSULTA:* ${record.consultaEndereco || "Não informado"}

*Gerado eletronicamente por CTC Consultas*`;
  };

  const handleCopyText = (record: ConsultationRecord) => {
    const text = getShareableText(record);
    navigator.clipboard.writeText(text);
    triggerToast("📋 Texto copiado para área de transferência!");
  };

  // Trigger print dialog
  const handlePrint = () => {
    window.print();
  };

  // Download high-def image
  const handleDownloadImage = async () => {
    const captureNode = previewRef.current;
    if (!captureNode) {
      alert("Houve um problema ao processar o documento. Tente novamente.");
      return;
    }
    
    setIsDownloading(true);
    triggerToast("📸 Renderizando imagem...");

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const dataUrl = await toPng(captureNode, {
        quality: 1,
        pixelRatio: 2, 
        backgroundColor: "#ffffff",
        style: {
          transform: "scale(1)",
          borderRadius: "0px",
          boxShadow: "none"
        }
      });
      
      const link = document.createElement("a");
      const safeName = (selectedRecord?.pacienteNome || "consulta")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");
      link.download = `ctc_confirmacao_${safeName}.png`;
      link.href = dataUrl;
      link.click();
      triggerToast("📥 Download de imagem concluído!");
    } catch (err) {
      console.error(err);
      alert("Falha ao gerar o arquivo de imagem.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sleek Sidebar Navigation */}
      <nav className="no-print w-full md:w-16 bg-slate-900 flex md:flex-col items-center justify-between md:justify-start py-4 md:py-6 px-4 md:px-0 gap-6 md:gap-8 shrink-0 border-b md:border-b-0 border-slate-800">
        <div className="flex md:flex-col items-center gap-4 md:gap-8 w-full md:w-auto">
          {/* Logo Brand container */}
          <div 
            onClick={navigateToHome}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 cursor-pointer rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-blue-500/20"
          >
            <span className="text-white font-extrabold text-lg font-mono">C</span>
          </div>

          <div className="flex md:flex-col items-center gap-3 md:gap-4">
            {/* View History Button */}
            <button 
              id="sidebar-btn-home"
              onClick={navigateToHome}
              title="Histórico de Registros"
              className={`p-3 rounded-xl transition-all ${
                currentView === "list" 
                  ? "text-white bg-blue-600 shadow-lg shadow-blue-900/50" 
                  : "text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800"
              }`}
            >
              <Home className="w-5 h-5" />
            </button>

            {/* Create New Button */}
            <button 
              id="sidebar-btn-create"
              onClick={navigateToCreate}
              title="Criar Novo Registro"
              className={`p-3 rounded-xl transition-all ${
                currentView === "form" 
                  ? "text-white bg-blue-600 shadow-lg shadow-blue-900/50" 
                  : "text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800"
              }`}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Footer database status on Desktop */}
        <div className="hidden md:flex mt-auto flex-col items-center">
          <div className="w-2 h-2 rounded-full bg-green-500" title="Banco de dados local online" />
        </div>
      </nav>

      {/* Main Container Workspace */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Sleek App Header banner */}
        <header className="no-print h-auto md:h-16 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between px-4 sm:px-8 py-3 md:py-0 shrink-0 gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <h1 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              Gerador de Confirmação
              <span className="text-[10px] font-mono tracking-widest bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-sm">
                CTC
              </span>
            </h1>
            <div className="hidden sm:block h-6 w-px bg-slate-200"></div>
            
            {/* Realtime Search tool - switches to list screen on typing list */}
            <div className="relative flex-1 md:flex-initial">
              <input 
                id="header-search-bar"
                type="text" 
                placeholder="Pesquisar por nome ou profissional..." 
                value={searchQuery}
                aria-label="Pesquisar por nome ou profissional"
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (currentView !== "list") {
                    setCurrentView("list");
                  }
                }}
                className="w-full sm:w-80 pl-9 pr-8 py-1.5 bg-slate-150 focus:bg-white text-slate-800 border-none rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/50 outline-hidden transition-all placeholder-slate-450"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 hover:text-rose-600 text-slate-450 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider hidden xs:inline">Status:</span>
            <span className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-md text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              BANCO DE DADOS ATIVO
            </span>
          </div>
        </header>

        {/* Content body layout container */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          
          {/* VIEW 1: RECORDS HISTORY LIST VIEW */}
          {currentView === "list" && (
            <div className="no-print space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Histórico de Confirmações</h2>
                  <p className="text-xs text-slate-500">Consulte ou edite as guias geradas no banco de dados local.</p>
                </div>

                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
                  {/* Filter by Date option */}
                  <div className="relative">
                    <input 
                      type="date"
                      value={searchDate}
                      aria-label="Filtrar por data da consulta"
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-650"
                    />
                    {searchDate && (
                      <button 
                        onClick={() => setSearchDate("")}
                        className="absolute right-2 top-2 text-[10px] text-rose-500 font-bold hover:underline"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={navigateToCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Registro</span>
                  </button>
                </div>
              </div>

              {/* Grid of saves */}
              {filteredRecords.length === 0 ? (
                <div className="bg-white border rounded-2xl p-12 text-center max-w-md mx-auto mt-12 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1">Nenhum registro encontrado</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    {searchQuery || searchDate 
                      ? "Experimente mudar os termos de busca ou remover os filtros." 
                      : "Sua lista de consultas está vazia! Crie uma para começar a imprimir."}
                  </p>
                  {(searchQuery || searchDate) ? (
                    <button 
                      onClick={() => {
                        setSearchQuery("");
                        setSearchDate("");
                      }}
                      className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Limpar filtros de busca
                    </button>
                  ) : (
                    <button 
                      onClick={navigateToCreate}
                      className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition-all"
                    >
                      Gerar primeira agora
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRecords.map((record) => (
                    <div 
                      key={record.id}
                      onClick={() => viewRecordDetails(record)}
                      className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Card metadata row */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[9px] font-mono font-semibold text-slate-400">
                            ID: #{record.id.slice(-6).toUpperCase()}
                          </span>
                          <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-sm">
                            OFICIAL-CTC
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-1">
                          {record.pacienteNome}
                        </h3>

                        <div className="mt-3 space-y-2 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-medium text-slate-700">
                              {formatDateBr(record.consultaData)} {record.consultaHorario ? `às ${record.consultaHorario}h` : ""}
                            </span>
                          </div>

                          <div className="flex items-start gap-1.5 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-slate-400 font-bold font-mono">🩺</span>
                            <div className="line-clamp-2">
                              <span className="font-semibold text-slate-800">{record.profissionalNome}</span>
                              {record.profissionalCargo && (
                                <span className="text-slate-500 block text-[10px]">{record.profissionalCargo}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-slate-400 font-bold font-mono">🗳️</span>
                            <span className="text-slate-550 font-mono">
                              Tit: {record.eleitorTitulo || "Sem dados"} | Z: {record.eleitorZona || "-"} | Sec: {record.eleitorSecao || "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card utility actions */}
                      <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToEdit(record);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                            title="Editar Dados"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyText(record);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                            title="Copiar Texto WhatsApp"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>

                        <button 
                          onClick={(e) => handleDelete(record.id, e)}
                          className="p-1.5 hover:bg-rose-50 text-slate-350 hover:text-rose-600 rounded-lg transition-colors"
                          title="Remover Registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: FORM CREATOR & REALTIME LIVE PREVIEW (Sleek layout) */}
          {currentView === "form" && (
            <div className="no-print flex flex-col xl:flex-row gap-6 items-start">
              
              {/* Form Entry Column Panel */}
              <div className="w-full xl:w-[500px] shrink-0 bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-col">
                
                {/* Panel head */}
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    Dados do Registro {editingId ? "(Edição)" : ""}
                  </h2>

                  <div className="flex items-center gap-1.5">
                    <button 
                      type="button" 
                      onClick={handleAutofillMockData}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg px-2 py-1 text-[10px] font-bold transition-all inline-flex items-center gap-1"
                    >
                      Exemplo
                    </button>

                    <button 
                      type="button" 
                      onClick={handleClearForm}
                      className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
                      title="Limpar campos"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Seção Paciente */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1">
                      Paciente & Documentação
                    </span>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Nome da Paciente <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Nome completo da paciente"
                        value={formData.pacienteNome}
                        onChange={(e) => handleInputChange("pacienteNome", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">WhatsApp da Paciente</label>
                        <input 
                          type="text" 
                          placeholder="(85) 99999-9999"
                          value={formData.pacienteWhatsapp}
                          onChange={(e) => handleInputChange("pacienteWhatsapp", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">CPF Paciente</label>
                        <input 
                          type="text" 
                          placeholder="000.000.000-00"
                          value={formData.pacienteCpf}
                          onChange={(e) => handleInputChange("pacienteCpf", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">RG Paciente</label>
                        <input 
                          type="text" 
                          placeholder="00.000.000-0"
                          value={formData.pacienteRg}
                          onChange={(e) => handleInputChange("pacienteRg", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 text-blue-600">CEP (Busca Automática)</label>
                        <input 
                          type="text" 
                          placeholder="00000-000"
                          value={formData.pacienteCep}
                          onChange={(e) => handleInputChange("pacienteCep", e.target.value)}
                          className="w-full px-3 py-2 border border-blue-200 focus:border-blue-500 bg-blue-50/20 focus:bg-white rounded-lg text-sm outline-hidden transition-all font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-9">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rua / Logradouro</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Rua Floriano Peixoto"
                          value={formData.pacienteRua}
                          onChange={(e) => handleInputChange("pacienteRua", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número</label>
                        <input 
                          type="text" 
                          placeholder="123"
                          value={formData.pacienteNumero}
                          onChange={(e) => handleInputChange("pacienteNumero", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-8">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cidade</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Fortaleza"
                          value={formData.pacienteCidade}
                          onChange={(e) => handleInputChange("pacienteCidade", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all"
                        />
                      </div>

                      <div className="col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado</label>
                        <input 
                          type="text" 
                          placeholder="Ex: CE"
                          value={formData.pacienteEstado}
                          onChange={(e) => handleInputChange("pacienteEstado", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all"
                        />
                      </div>
                    </div>

                    {/* Eleitor Title details */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título de Eleitor</label>
                        <input 
                          type="text" 
                          placeholder="0000 0000 0000"
                          value={formData.eleitorTitulo}
                          onChange={(e) => handleInputChange("eleitorTitulo", e.target.value)}
                          className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:border-blue-500 outline-hidden transition-all font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 text-center">Zona</label>
                        <input 
                          type="text" 
                          placeholder="000"
                          value={formData.eleitorZona}
                          onChange={(e) => handleInputChange("eleitorZona", e.target.value)}
                          className="w-full px-1 py-2 text-center border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:border-blue-500 outline-hidden transition-all font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 text-center">Seção</label>
                        <input 
                          type="text" 
                          placeholder="0000"
                          value={formData.eleitorSecao}
                          onChange={(e) => handleInputChange("eleitorSecao", e.target.value)}
                          className="w-full px-1 py-2 text-center border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:border-blue-500 outline-hidden transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seção Consulta */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1">
                      Profissional & Agendamento
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Nome do Profissional <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required
                          placeholder="Ex: Dra. Juliana Mendes"
                          value={formData.profissionalNome}
                          onChange={(e) => handleInputChange("profissionalNome", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Qual Profissionais/Cargo</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Ginecologista & Obstetra"
                          value={formData.profissionalCargo}
                          onChange={(e) => handleInputChange("profissionalCargo", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data da Consulta <span className="text-red-500">*</span></label>
                        <input 
                          type="date" 
                          required
                          value={formData.consultaData}
                          onChange={(e) => handleInputChange("consultaData", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Horário</label>
                        <input 
                          type="time" 
                          value={formData.consultaHorario}
                          onChange={(e) => handleInputChange("consultaHorario", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Endereço da Consulta</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Av. Paulista, 1000 - Sala 42"
                        value={formData.consultaEndereco}
                        onChange={(e) => handleInputChange("consultaEndereco", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2">
                    {editingId && (
                      <button 
                        type="button"
                        onClick={navigateToHome}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                    
                    <button 
                      type="submit"
                      id="form-btn-submit"
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/10"
                    >
                      <Check className="w-4 h-4" />
                      {editingId ? "Salvar Alterações" : "Gerar Documento & Salvar"}
                    </button>
                  </div>

                </form>
              </div>

              {/* Realtime Preview Column Panel */}
              <div className="flex-1 w-full space-y-4">
                
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    Visualização em Tempo Real (Documento Gerado)
                  </h2>
                </div>

                {/* Simulated frame preview of document */}
                <div className="bg-white border-t-4 border-blue-600 shadow-xl rounded-b-lg p-6 sm:p-10 flex flex-col min-h-[500px]">
                  
                  {/* Doc main title centered as requested */}
                  <div className="text-center mb-8 border-b border-slate-150 pb-5">
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                      CTC CONSULTAS / CONFIRMAÇÃO
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                      Guia Oficial de Confirmação e Atendimento Clínico
                    </p>
                  </div>

                  {/* Doc metadata categories */}
                  <div className="flex-1 space-y-6 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                      
                      <section>
                        <h4 className="text-[10px] font-bold text-blue-600 uppercase mb-1.5 tracking-wider">
                          Paciente
                        </h4>
                        <p className="font-bold text-slate-900">
                          {formData.pacienteNome || "Digite o Nome da Paciente..."}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          WhatsApp: {formData.pacienteWhatsapp || "(85) 99999-9999"}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          CPF: {formData.pacienteCpf || "000.000.000-00"} | RG: {formData.pacienteRg || "00.000.000-0"}
                        </p>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Endereço: {formData.pacienteRua ? (
                            <span>
                              {formData.pacienteRua}{formData.pacienteNumero ? `, ${formData.pacienteNumero}` : ""}{formData.pacienteCidade ? ` - ${formData.pacienteCidade}` : ""}{formData.pacienteEstado ? ` / ${formData.pacienteEstado}` : ""}{formData.pacienteCep ? ` (CEP: ${formData.pacienteCep})` : ""}
                            </span>
                          ) : (
                            formData.pacienteEndereco || "Não informado"
                          )}
                        </p>
                      </section>

                      <section>
                        <h4 className="text-[10px] font-bold text-blue-600 uppercase mb-1.5 tracking-wider">
                          Documentação Eleitoral
                        </h4>
                        <p className="text-xs text-slate-800 font-bold font-mono">
                          Título: {formData.eleitorTitulo || "--- ---- ----"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Zona: <span className="font-mono bg-slate-50 px-1 py-0.5 border text-slate-700 font-semibold">{formData.eleitorZona || "---"}</span> 
                          {" | "} 
                          Seção: <span className="font-mono bg-slate-50 px-1 py-0.5 border text-slate-700 font-semibold">{formData.eleitorSecao || "----"}</span>
                        </p>
                        <p className="text-[10px] text-slate-450 italic mt-3">
                          * Dados eleitorais vinculados para validação cadastral.
                        </p>
                      </section>

                      <section className="col-span-1 sm:col-span-2">
                        <h4 className="text-[10px] font-bold text-blue-600 uppercase mb-1.5 tracking-wider">
                          Detalhes da Consulta Agendada
                        </h4>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-150">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {formData.profissionalNome || "Qual Profissional / Nome..."}
                              </p>
                              <p className="text-xs text-slate-600 font-medium">
                                {formData.profissionalCargo || "Especialidade Geral"}
                              </p>
                            </div>
                            <div className="sm:text-right shrink-0 bg-white border px-3 py-1.5 rounded-lg shadow-2xs">
                              <p className="text-xs sm:text-sm font-black text-blue-700">
                                {formatDateBr(formData.consultaData) || "__/__/____"}
                              </p>
                              <p className="text-xs font-bold text-slate-800">
                                {formData.consultaHorario ? `${formData.consultaHorario}h` : "--:--"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              ENDEREÇO DA CONSULTA/ATENDIMENTO
                            </p>
                            <p className="text-xs text-slate-700 font-semibold">
                              {formData.consultaEndereco || "Local da consulta não preenchido"}
                            </p>
                          </div>
                        </div>
                      </section>

                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                      <p className="text-[9px] text-slate-400 font-mono">ID: #CTC-2026-PREVIEW</p>
                      <p className="text-[9px] text-slate-400 font-mono">Pronto para salvar no banco</p>
                    </div>
                    <div className="flex items-center gap-2 opacity-40">
                      <div className="w-10 h-10 border border-slate-400 rounded flex items-center justify-center font-bold text-slate-400 text-[10px] font-mono">QR</div>
                      <div className="text-[9px] font-bold text-slate-400 leading-tight">CÓDIGO DE<br />VALIDAÇÃO</div>
                    </div>
                  </div>

                </div>

              </div>
              
            </div>
          )}

          {/* VIEW 3: SAVED RECORD MULTI-UTILITY PREVIEW PANEL */}
          {currentView === "preview" && selectedRecord && (
            <div className="space-y-6">
              
              {/* Controls Toolbar Panel */}
              <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={navigateToHome}
                    className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border"
                    title="Voltar"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="font-bold text-slate-850 text-sm sm:text-base leading-tight">
                      Confirmado: {selectedRecord.pacienteNome}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500">
                      Documento salvo no banco. Prontinho para compartilhar.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 justify-end">
                  {/* Copy button */}
                  <button 
                    onClick={() => handleCopyText(selectedRecord)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 border border-blue-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </button>

                  {/* Print PDF button */}
                  <button 
                    onClick={handlePrint}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir / PDF</span>
                  </button>

                  {/* High Quality Image Download */}
                  <button 
                    onClick={handleDownloadImage}
                    disabled={isDownloading}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloading ? "Gerando..." : "Baixar Imagem"}</span>
                  </button>

                  {/* Edit action */}
                  <button 
                    onClick={() => navigateToEdit(selectedRecord)}
                    className="p-2 hover:bg-slate-100 border text-slate-600 rounded-lg transition-colors"
                    title="Editar Registro"
                  >
                    <Edit className="w-4.5 h-4.5" />
                  </button>

                  {/* Remove permanent */}
                  <button 
                    onClick={() => handleDelete(selectedRecord.id)}
                    className="p-2 hover:bg-rose-50 border border-rose-100 text-rose-600 rounded-lg transition-colors"
                    title="Excluir do banco"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Master layout - the document container itself centered */}
              <div className="flex justify-center p-0 sm:p-4">
                
                {/* Captured nodes frame */}
                <div 
                  ref={previewRef}
                  id="rendered-document-sheet"
                  className="bg-white text-slate-900 border border-slate-300 p-6 sm:p-12 w-full max-w-[650px] shadow-xl relative"
                  style={{ fontFamily: "inherit" }}
                >
                  
                  {/* Centered medical background logo watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.02]">
                    <span style={{ fontSize: "12rem" }}>🩺</span>
                  </div>

                  {/* Document header as requested layout */}
                  <div className="text-center mb-8 border-b-2 border-slate-900 pb-5 relative z-10">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      CTC CONSULTAS / CONFIRMAÇÃO
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">
                      SISTEMA DE CONFIRMAÇÃO DE AGENDAMENTO MÉDICO
                    </p>
                  </div>

                  {/* Document content values info */}
                  <div className="space-y-6 text-sm relative z-10">
                    
                    {/* Patient & eleitor record details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4 border-b border-dashed border-slate-200">
                      
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Identificação da Paciente
                        </h4>
                        <p className="text-base font-black text-slate-900">
                          {selectedRecord.pacienteNome}
                        </p>
                        
                        {selectedRecord.pacienteWhatsapp && (
                          <p className="text-xs text-slate-600 mt-1 font-mono">
                            WhatsApp: <span className="font-semibold text-slate-800">{selectedRecord.pacienteWhatsapp}</span>
                          </p>
                        )}

                        <div className="mt-1 text-xs text-slate-600">
                          <span className="font-medium text-slate-500">CPF:</span> <span className="font-mono text-slate-800 font-semibold">{selectedRecord.pacienteCpf || "Não informado"}</span>
                          {" | "}
                          <span className="font-medium text-slate-500">RG:</span> <span className="font-mono text-slate-800 font-semibold">{selectedRecord.pacienteRg || "Não informado"}</span>
                        </div>

                        {selectedRecord.pacienteRua ? (
                          <p className="text-xs text-slate-600 mt-1">
                            <span className="font-medium text-slate-500">Endereço:</span>{" "}
                            <span className="text-slate-850">
                              {selectedRecord.pacienteRua}{selectedRecord.pacienteNumero ? `, ${selectedRecord.pacienteNumero}` : ""}{selectedRecord.pacienteCidade ? ` - ${selectedRecord.pacienteCidade}` : ""}{selectedRecord.pacienteEstado ? ` / ${selectedRecord.pacienteEstado}` : ""}{selectedRecord.pacienteCep ? ` (CEP: ${selectedRecord.pacienteCep})` : ""}
                            </span>
                          </p>
                        ) : selectedRecord.pacienteEndereco ? (
                          <p className="text-xs text-slate-600 mt-1">
                            <span className="font-medium text-slate-500">Endereço:</span> <span className="text-slate-850">{selectedRecord.pacienteEndereco}</span>
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Documentação Eleitoral
                        </h4>
                        <p className="text-sm font-bold font-mono text-slate-900">
                          Título: {selectedRecord.eleitorTitulo || "--- ---- ----"}
                        </p>
                        
                        <div className="mt-1.5 flex gap-2">
                          <div className="bg-slate-100 border text-[11px] font-mono px-2 py-1 rounded-sm text-slate-800">
                            <span className="text-slate-500 text-[9px] font-sans block uppercase font-bold">Zona</span>
                            <span className="font-bold">{selectedRecord.eleitorZona || "---"}</span>
                          </div>

                          <div className="bg-slate-100 border text-[11px] font-mono px-2 py-1 rounded-sm text-slate-800">
                            <span className="text-slate-500 text-[9px] font-sans block uppercase font-bold">Seção</span>
                            <span className="font-bold">{selectedRecord.eleitorSecao || "----"}</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 mt-3 italic leading-tight">
                          Validação de elegibilidade local cadastrada no sistema.
                        </p>
                      </div>

                    </div>

                    {/* Booking details card */}
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Dados de Agendamento Oficial
                      </h4>
                      
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-800 font-mono">
                              🩺 Profissional:
                            </p>
                            <p className="text-base font-black text-blue-700 mt-0.5">
                              {selectedRecord.profissionalNome}
                            </p>
                            {selectedRecord.profissionalCargo && (
                              <p className="text-xs text-slate-500 italic">
                                Cargo/Especialidade: {selectedRecord.profissionalCargo}
                              </p>
                            )}
                          </div>

                          <div className="bg-white border-2 border-blue-600 rounded-lg p-3 sm:text-center shadow-xs self-start sm:self-auto min-w-[120px]">
                            <p className="text-[9px] text-slate-400 uppercase font-bold">DATA / HORA</p>
                            <p className="text-sm font-black text-blue-700">
                              {formatDateBr(selectedRecord.consultaData)}
                            </p>
                            <p className="text-sm font-bold text-slate-800">
                              {selectedRecord.consultaHorario ? `${selectedRecord.consultaHorario}h` : "Não informado"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 text-xs">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                            Local da Consulta médica:
                          </p>
                          <p className="text-slate-850 font-bold">
                            {selectedRecord.consultaEndereco || "Não preenchido"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Verification and signature simulation block */}
                    <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono text-slate-400">ID: #{selectedRecord.id}</p>
                        <p className="text-[9px] text-slate-400 leading-tight">
                          Gerado em: {new Date(selectedRecord.createdAt || Date.now()).toLocaleDateString("pt-BR")} às {new Date(selectedRecord.createdAt || Date.now()).toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"})}
                        </p>
                      </div>

                      <div className="text-center sm:text-right">
                        <div className="border-b border-slate-400 w-44 inline-block mb-1" />
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                          Assinatura Responsável / Carimbo CTC
                        </p>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
