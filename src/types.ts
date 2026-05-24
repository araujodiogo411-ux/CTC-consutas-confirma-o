export interface ConsultationRecord {
  id: string;
  pacienteNome: string;
  pacienteCpf: string;
  pacienteRg: string;
  pacienteWhatsapp: string;
  pacienteEndereco: string; // legacy formatted or generated from fields
  pacienteCep: string;
  pacienteRua: string;
  pacienteNumero: string;
  pacienteCidade: string;
  pacienteEstado: string;
  consultaData: string;
  consultaHorario: string;
  consultaEndereco: string;
  profissionalNome: string;
  profissionalCargo: string; // "Qual profissional" / Especialidade
  eleitorTitulo: string;
  eleitorZona: string;
  eleitorSecao: string;
  createdAt: string;
}
