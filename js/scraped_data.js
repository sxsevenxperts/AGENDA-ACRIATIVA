/* ============================================================
   AGENDA SOBRAL — Equipamentos Públicos (base ampliada)
   ------------------------------------------------------------
   Dados consolidados a partir do portal oficial
   https://sobral.ce.gov.br (secretarias, escolas, CEIs, ETIs,
   unidades de saúde e assistência social).
   Cada equipamento é vinculado a uma secretaria válida e recebe
   automaticamente login administrativo exclusivo + serviço de
   atendimento agendável (ver js/data.js e js/storage.js).
   ============================================================ */

const ScrapedEquipamentos = [
  /* ---------------- EDUCAÇÃO (SME) — Escolas e Centros ---------------- */
  { id: 'eti-campelo-costa',   secretaria_id: 'sme', nome: 'EEF Campelo Costa (ETI)',            tipo: 'Escola de Tempo Integral', endereco: 'Av. José Figueiredo de Paula Pessoa, s/n – Alto da Brasília', telefone: '(88) 3677-1192', horario: 'Seg a Sex: 07h às 17h', bairro: 'Alto da Brasília' },
  { id: 'eti-leonel-brizola',  secretaria_id: 'sme', nome: 'EEF Leonel Brizola (ETI)',           tipo: 'Escola de Tempo Integral', endereco: 'Av. John Sanford, s/n – Nova Caiçara',                      telefone: '(88) 3677-1192', horario: 'Seg a Sex: 07h às 17h', bairro: 'Nova Caiçara' },
  { id: 'eti-edgar-linhares',  secretaria_id: 'sme', nome: 'EEF Edgar Linhares (ETI)',           tipo: 'Escola de Tempo Integral', endereco: 'Rua das Andorinhas, 50 – Nova Caiçara',                     telefone: '(88) 3677-1192', horario: 'Seg a Sex: 07h às 17h', bairro: 'Nova Caiçara' },
  { id: 'esc-antenor-naspolini', secretaria_id: 'sme', nome: 'EEF Antenor Naspolini',            tipo: 'Escola Municipal',         endereco: 'Rua Prefeito Jerônimo Prado, s/n – Dom José',               telefone: '(88) 3677-1192', horario: 'Seg a Sex: 07h às 17h', bairro: 'Dom José' },
  { id: 'esc-emilio-sendim',   secretaria_id: 'sme', nome: 'EEF Emílio Sendim',                  tipo: 'Escola Municipal',         endereco: 'Rua Eduardo de Almeida Sanford, 273 – Domingos Olímpio',    telefone: '(88) 3677-1192', horario: 'Seg a Sex: 07h às 17h', bairro: 'Domingos Olímpio' },
  { id: 'esc-netinha-castelo', secretaria_id: 'sme', nome: 'EEF Netinha Castelo',                tipo: 'Escola Municipal',         endereco: 'Av. John Sanford, 457 – Junco',                            telefone: '(88) 3677-1192', horario: 'Seg a Sex: 07h às 17h', bairro: 'Junco' },
  { id: 'esc-raimundo-pimentel', secretaria_id: 'sme', nome: 'EEF Raimundo Pimentel Gomes',      tipo: 'Escola Municipal',         endereco: 'Av. José Figueiredo de Paula Pessoa, 428 – Expectativa',    telefone: '(88) 3677-1192', horario: 'Seg a Sex: 07h às 17h', bairro: 'Expectativa' },
  { id: 'cei-armando-freitas', secretaria_id: 'sme', nome: 'CEI Armando Freitas Pereira',        tipo: 'Centro de Educação Infantil', endereco: 'Rua Carlito Pompeu, 565 – Centro',                      telefone: '(88) 3677-1192', horario: 'Seg a Sex: 07h às 17h', bairro: 'Centro' },
  { id: 'cei-darcy-ribeiro',   secretaria_id: 'sme', nome: 'CEI Darcy Ribeiro',                  tipo: 'Centro de Educação Infantil', endereco: 'Rua Ayrton Senna, 310 – Cidade Dr. José Euclides',       telefone: '(88) 3677-1192', horario: 'Seg a Sex: 07h às 17h', bairro: 'Cidade Dr. José Euclides' },
  { id: 'cei-guaracy-parente', secretaria_id: 'sme', nome: 'CEI Guaracy Parente',                tipo: 'Centro de Educação Infantil', endereco: 'Rua Antônio Rodrigues Magalhães, s/n – Dom Expedito',    telefone: '(88) 3677-1192', horario: 'Seg a Sex: 07h às 17h', bairro: 'Dom Expedito' },

  /* ---------------- SAÚDE (SMS) — Unidades adicionais ---------------- */
  { id: 'csf-sinha-saboia',    secretaria_id: 'sms', nome: 'CSF Sinhá Sabóia',                   tipo: 'Centro de Saúde da Família', endereco: 'Rua Rio Negro, s/n – Sinhá Sabóia',                       telefone: '(88) 3677-1230', horario: 'Seg a Sex: 07h às 17h', bairro: 'Sinhá Sabóia' },
  { id: 'csf-cohab-ii',        secretaria_id: 'sms', nome: 'CSF Cohab II',                        tipo: 'Centro de Saúde da Família', endereco: 'Rua Maximino Barreto, s/n – Cohab II',                     telefone: '(88) 3677-1231', horario: 'Seg a Sex: 07h às 17h', bairro: 'Cohab II' },
  { id: 'csf-sumare',          secretaria_id: 'sms', nome: 'CSF Sumaré',                          tipo: 'Centro de Saúde da Família', endereco: 'Rua Arcoverde, 556 – Sumaré',                              telefone: '(88) 3677-1232', horario: 'Seg a Sex: 07h às 17h', bairro: 'Sumaré' },
  { id: 'policlinica-norte',   secretaria_id: 'sms', nome: 'Policlínica Regional Norte',         tipo: 'Policlínica',                endereco: 'Av. John Sanford, s/n – Junco',                            telefone: '(88) 3677-1240', horario: 'Seg a Sex: 07h às 17h', bairro: 'Junco' },

  /* ---------------- ASSISTÊNCIA SOCIAL (SEDHAS) ---------------- */
  { id: 'centro-dia-idoso',    secretaria_id: 'sedhas', nome: 'Centro Dia do Idoso Rosa Maria Rodrigues', tipo: 'Centro de Convivência', endereco: 'Travessa José Maria Alverne, s/n – Sumaré',            telefone: '(88) 3677-1440', horario: 'Seg a Sex: 08h às 17h', bairro: 'Sumaré' },
  { id: 'pousada-social',      secretaria_id: 'sedhas', nome: 'Pousada Social de Sobral',        tipo: 'Acolhimento',                endereco: 'Rua Coronel Estanislau Frota, s/n – Centro',               telefone: '(88) 3677-1441', horario: 'Seg a Sex: 08h às 17h', bairro: 'Centro' },

  /* ---------------- MEIO AMBIENTE (AMMA) ---------------- */
  { id: 'sede-amma',           secretaria_id: 'amma', nome: 'Agência Municipal do Meio Ambiente', tipo: 'Sede Administrativa',       endereco: 'Av. Cel. José Euclides Ferreira Gomes, 341 – Campo dos Velhos', telefone: '(88) 3677-1160', horario: 'Seg a Sex: 08h às 17h', bairro: 'Campo dos Velhos' },

  /* ---------------- CONSERVAÇÃO E SERVIÇOS PÚBLICOS (SCSP) ---------------- */
  { id: 'sede-scsp',           secretaria_id: 'scsp', nome: 'Sec. da Conservação e Serviços Públicos', tipo: 'Sede Administrativa',   endereco: 'Rua D. João do Monte, 535 – Centro',                       telefone: '(88) 3695-4100', horario: 'Seg a Sex: 08h às 17h', bairro: 'Centro' },

  /* ---------------- CONTROLADORIA (CAGM) ---------------- */
  { id: 'sede-cagm',           secretaria_id: 'cagm', nome: 'Controladoria e Auditoria Geral do Município', tipo: 'Sede Administrativa', endereco: 'Rua Viriato de Medeiros, 1250 – 1º Andar – Centro',       telefone: '(88) 3677-1100', horario: 'Seg a Sex: 08h às 17h', bairro: 'Centro' },

  /* ---------------- PECUÁRIA (SEPEC) ---------------- */
  { id: 'sede-pecuaria',       secretaria_id: 'pecuaria', nome: 'Secretaria da Pecuária',        tipo: 'Sede Administrativa',        endereco: 'Av. Dr. José Arimathéa Monte e Silva, 300 – Junco',        telefone: '(88) 3677-1150', horario: 'Seg a Sex: 08h às 17h', bairro: 'Junco' },

  /* ---------------- DESENVOLVIMENTO DISTRITAL (SDD) ---------------- */
  { id: 'sede-sdd',            secretaria_id: 'sdd', nome: 'Sec. do Desenvolvimento Distrital',  tipo: 'Sede Administrativa',        endereco: 'Rua Viriato de Medeiros, 1250 – Centro',                   telefone: '(88) 3677-1100', horario: 'Seg a Sex: 08h às 17h', bairro: 'Centro' },

  /* ---------------- GOVERNO (SEGOV) ---------------- */
  { id: 'sede-segov',          secretaria_id: 'segov', nome: 'Secretaria do Governo',            tipo: 'Sede Administrativa',        endereco: 'Rua Viriato de Medeiros, 1250 – Centro',                   telefone: '(88) 3677-1100', horario: 'Seg a Sex: 08h às 17h', bairro: 'Centro' },

  /* ---------------- GABINETE DA VICE-PREFEITA (GVP) ---------------- */
  { id: 'sede-gvp',            secretaria_id: 'gvp', nome: 'Gabinete da Vice-Prefeita',          tipo: 'Sede Administrativa',        endereco: 'Rua Randal Pompeu, s/n – Centro',                          telefone: '(88) 3677-1100', horario: 'Seg a Sex: 08h às 17h', bairro: 'Centro' }
];
