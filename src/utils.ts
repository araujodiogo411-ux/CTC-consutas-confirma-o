import { ConsultationRecord } from "./types";

const LOCAL_STORAGE_KEY = "ctc_consultas_records";

const INITIAL_MOCK_RECORDS: ConsultationRecord[] = [
  {
    id: "mock-1",
    pacienteNome: "Mariana Souza dos Santos",
    pacienteCpf: "123.456.789-10",
    pacienteRg: "45.678.901-2",
    pacienteWhatsapp: "(11) 98765-4321",
    pacienteEndereco: "Rua das Palmeiras, 142 - São Paulo / SP",
    pacienteCep: "01153-000",
    pacienteRua: "Rua das Palmeiras",
    pacienteNumero: "142",
    pacienteCidade: "São Paulo",
    pacienteEstado: "SP",
    consultaData: "2026-05-28",
    consultaHorario: "14:30",
    consultaEndereco: "Clínica Saúde & Vida, Av. Paulista, 1000 - Bela Vista, São Paulo / SP",
    profissionalNome: "Dra. Heloísa Vasconcelos",
    profissionalCargo: "Ginecologista e Obstetra",
    eleitorTitulo: "4829 1049 3920",
    eleitorZona: "005",
    eleitorSecao: "0314",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "mock-2",
    pacienteNome: "Francisca das Chagas Silva",
    pacienteCpf: "987.654.321-00",
    pacienteRg: "12.345.678-x",
    pacienteWhatsapp: "(85) 99123-4567",
    pacienteEndereco: "Rua São Pedro, 45 - Fortaleza / CE",
    pacienteCep: "60015-000",
    pacienteRua: "Rua São Pedro",
    pacienteNumero: "45",
    pacienteCidade: "Fortaleza",
    pacienteEstado: "CE",
    consultaData: "2026-06-02",
    consultaHorario: "09:15",
    consultaEndereco: "Hospital da Mulher, Rua Dom Luís, 250 - Meireles, Fortaleza / CE",
    profissionalNome: "Dra. Patrícia Albuquerque",
    profissionalCargo: "Cardiologista",
    eleitorTitulo: "1923 8847 2011",
    eleitorZona: "082",
    eleitorSecao: "0105",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
  },
];

export function getRecords(): ConsultationRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_RECORDS));
      return INITIAL_MOCK_RECORDS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao carregar registros do localStorage", error);
    return INITIAL_MOCK_RECORDS;
  }
}

export function saveRecord(record: ConsultationRecord): ConsultationRecord[] {
  try {
    const records = getRecords();
    const index = records.findIndex((r) => r.id === record.id);
    if (index > -1) {
      records[index] = record;
    } else {
      records.unshift(record); // Prepend new records so they show on top
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    return records;
  } catch (error) {
    console.error("Erro ao salvar registro", error);
    return getRecords();
  }
}

export function deleteRecord(id: string): ConsultationRecord[] {
  try {
    const records = getRecords();
    const updated = records.filter((r) => r.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Erro ao deletar registro", error);
    return getRecords();
  }
}

// Field formatting helpers
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return value.substring(0, 14);
}

export function formatRG(value: string): string {
  // Let's clean the string and format to XX.XXX.XXX-X
  const clean = value.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length <= 9) {
    return clean
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})([a-zA-Z0-9]{1,2})$/, "$1-$2");
  }
  return value.substring(0, 12);
}

export function formatWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    if (digits.length > 10) {
      // (XX) XXXXX-XXXX
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
    } else if (digits.length > 6) {
      // (XX) XXXX-XXXX
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    } else if (digits.length > 2) {
      return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    } else if (digits.length > 0) {
      return `(${digits}`;
    }
  }
  return value.substring(0, 15);
}

export function formatEleitorTitulo(value: string): string {
  const digits = value.replace(/\D/g, "");
  // Standard format is groups of 4: "0000 0000 0000"
  if (digits.length <= 12) {
    return digits
      .replace(/(\d{4})(\d)/, "$1 $2")
      .replace(/(\d{4}\s\d{4})(\d)/, "$1 $2");
  }
  return value.substring(0, 14);
}

export function formatDateBr(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 8) {
    if (digits.length > 5) {
      return `${digits.substring(0, 5)}-${digits.substring(5)}`;
    }
    return digits;
  }
  return `${digits.substring(0, 5)}-${digits.substring(5, 8)}`;
}
