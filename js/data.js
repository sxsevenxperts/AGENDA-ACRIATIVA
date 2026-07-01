/* ============================================
   AGENDA SOBRAL — Dados Pré-carregados
   Secretarias, equipamentos e serviços reais
   de Sobral/CE
   ============================================ */

const SobralData = {
  /* ----------------------------------------
     SECRETARIAS
     ---------------------------------------- */
  secretarias: [
    {
      id: 'sms',
      nome: 'Secretaria Municipal da Saúde',
      sigla: 'SMS',
      icone: 'health',
      cor: '#E53E3E',
      descricao: 'Atendimento em saúde básica, especializada e de urgência.'
    },
    {
      id: 'sme',
      nome: 'Secretaria Municipal da Educação',
      sigla: 'SME',
      icone: 'school',
      cor: '#3182CE',
      descricao: 'Matrículas, transferências e serviços educacionais.'
    },
    {
      id: 'sedhas',
      nome: 'Sec. Direitos Humanos, Habitação e Assistência Social',
      sigla: 'SEDHAS',
      icone: 'people',
      cor: '#805AD5',
      descricao: 'Cadastro Único, Bolsa Família, assistência social e habitação.'
    },
    {
      id: 'seplag',
      nome: 'Secretaria do Planejamento e Gestão',
      sigla: 'SEPLAG',
      icone: 'analytics',
      cor: '#0052A5',
      descricao: 'Planejamento estratégico, gestão pública e modernização.'
    },
    {
      id: 'sefin',
      nome: 'Secretaria das Finanças',
      sigla: 'SEFIN',
      icone: 'finance',
      cor: '#00875A',
      descricao: 'IPTU, ISS, taxas, certidões e tributos municipais.'
    },
    {
      id: 'seinfra',
      nome: 'Secretaria da Infraestrutura',
      sigla: 'SEINFRA',
      icone: 'build',
      cor: '#DD6B20',
      descricao: 'Obras públicas, pavimentação e infraestrutura urbana.'
    },
    {
      id: 'seuma',
      nome: 'Sec. Urbanismo, Habitação e Meio Ambiente',
      sigla: 'SEUMA',
      icone: 'nature',
      cor: '#38A169',
      descricao: 'Licenciamento ambiental, alvarás, habite-se e urbanismo.'
    },
    {
      id: 'sesec',
      nome: 'Secretaria da Segurança Cidadã',
      sigla: 'SESEC',
      icone: 'shield',
      cor: '#2D3748',
      descricao: 'Segurança pública, Guarda Municipal e videomonitoramento.'
    },
    {
      id: 'setran',
      nome: 'Secretaria do Trânsito',
      sigla: 'SETRAN',
      icone: 'traffic',
      cor: '#E53E3E',
      descricao: 'Multas, sinalização, licenciamento e trânsito.'
    },
    {
      id: 'setransp',
      nome: 'Secretaria do Transporte',
      sigla: 'SETRANSP',
      icone: 'bus',
      cor: '#4299E1',
      descricao: 'Transporte público, cartão estudantil e itinerários.'
    },
    {
      id: 'stde',
      nome: 'Sec. Trabalho e Desenvolvimento Econômico',
      sigla: 'STDE',
      icone: 'work',
      cor: '#D69E2E',
      descricao: 'Emprego, capacitação profissional e microempreendedorismo.'
    },
    {
      id: 'sejuc',
      nome: 'Secretaria da Juventude e Cultura',
      sigla: 'SEJUC',
      icone: 'palette',
      cor: '#9F7AEA',
      descricao: 'Programas culturais, eventos e políticas de juventude.'
    },
    {
      id: 'sespol',
      nome: 'Secretaria do Esporte e Lazer',
      sigla: 'SESPOL',
      icone: 'sports',
      cor: '#F56565',
      descricao: 'Equipamentos esportivos, areninhas e programas de lazer.'
    },
    {
      id: 'seagri',
      nome: 'Secretaria da Agricultura',
      sigla: 'SEAGRI',
      icone: 'agriculture',
      cor: '#48BB78',
      descricao: 'Apoio ao produtor rural, DAP e programas agrícolas.'
    },
    {
      id: 'setur',
      nome: 'Secretaria do Turismo e Eventos',
      sigla: 'SETUR',
      icone: 'tour',
      cor: '#ED8936',
      descricao: 'Turismo, eventos culturais e promoção da cidade.'
    },
    {
      id: 'pgm',
      nome: 'Procuradoria Geral do Município',
      sigla: 'PGM',
      icone: 'gavel',
      cor: '#4A5568',
      descricao: 'Assessoria jurídica, processos e pareceres legais.'
    },
    {
      id: 'saae',
      nome: 'Serviço Autônomo de Água e Esgoto',
      sigla: 'SAAE',
      icone: 'water',
      cor: '#0BC5EA',
      descricao: 'Ligação de água, esgoto, segunda via e reparos.'
    }
  ],

  /* ----------------------------------------
     EQUIPAMENTOS PÚBLICOS / UNIDADES
     ---------------------------------------- */
  equipamentos: [
    // --- SAÚDE (SMS) ---
    {
      id: 'csf-alto-brasilia',
      secretaria_id: 'sms',
      nome: 'CSF Alto da Brasília',
      tipo: 'Centro de Saúde da Família',
      endereco: 'Rua Pedro Gomes, 500 – Alto da Brasília',
      telefone: '(88) 3677-1200',
      horario: 'Seg a Sex: 07h às 17h',
      bairro: 'Alto da Brasília'
    },
    {
      id: 'csf-luciano',
      secretaria_id: 'sms',
      nome: 'CSF Dr. Luciano Adeodato',
      tipo: 'Centro de Saúde da Família',
      endereco: 'Rua Anahid Andrade, s/n – Centro',
      telefone: '(88) 3677-1201',
      horario: 'Seg a Sex: 07h às 17h',
      bairro: 'Centro'
    },
    {
      id: 'csf-joao-abdelmoumem',
      secretaria_id: 'sms',
      nome: 'CSF João Abdelmoumem Melo',
      tipo: 'Centro de Saúde da Família',
      endereco: 'Rua Jandáia, 55 – Res. Nova Caiçara',
      telefone: '(88) 3677-1202',
      horario: 'Seg a Sex: 07h às 17h',
      bairro: 'Nova Caiçara'
    },
    {
      id: 'csf-dom-expedito',
      secretaria_id: 'sms',
      nome: 'CSF Dona Maria Eglantine',
      tipo: 'Centro de Saúde da Família',
      endereco: 'Rua Helio Arruda Coelho, s/n – Dom Expedito',
      telefone: '(88) 3677-1203',
      horario: 'Seg a Sex: 07h às 17h',
      bairro: 'Dom Expedito'
    },
    {
      id: 'upa-sobral',
      secretaria_id: 'sms',
      nome: 'UPA Dr. Hugo Mendes Parente',
      tipo: 'Unidade de Pronto Atendimento',
      endereco: 'Av. John Sanford – Junco',
      telefone: '(88) 3677-1210',
      horario: '24 horas',
      bairro: 'Junco'
    },
    {
      id: 'ceo-sobral',
      secretaria_id: 'sms',
      nome: 'Centro de Especialidades Odontológicas',
      tipo: 'CEO',
      endereco: 'Centro – Sobral',
      telefone: '(88) 3677-1215',
      horario: 'Seg a Sex: 07h às 17h',
      bairro: 'Centro'
    },
    {
      id: 'caps-sobral',
      secretaria_id: 'sms',
      nome: 'CAPS – Centro de Atenção Psicossocial',
      tipo: 'CAPS',
      endereco: 'Centro – Sobral',
      telefone: '(88) 3677-1220',
      horario: 'Seg a Sex: 07h às 17h',
      bairro: 'Centro'
    },
    {
      id: 'sede-sms',
      secretaria_id: 'sms',
      nome: 'Sede da Secretaria da Saúde',
      tipo: 'Sede Administrativa',
      endereco: 'Rua Anahid Andrade, 373 – Centro',
      telefone: '(88) 3677-1100',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Centro'
    },

    // --- EDUCAÇÃO (SME) ---
    {
      id: 'sede-sme',
      secretaria_id: 'sme',
      nome: 'Sede da Secretaria da Educação',
      tipo: 'Sede Administrativa',
      endereco: 'Rua Viriato de Medeiros – Centro',
      telefone: '(88) 3677-1300',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Centro'
    },

    // --- ASSISTÊNCIA SOCIAL (SEDHAS) ---
    {
      id: 'casa-cidadao',
      secretaria_id: 'sedhas',
      nome: 'Casa do Cidadão',
      tipo: 'Central de Serviços',
      endereco: 'Rua Cel. José Sabóia, 513 – Centro',
      telefone: '(88) 3677-1400',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Centro'
    },
    {
      id: 'cras-mimi',
      secretaria_id: 'sedhas',
      nome: 'CRAS Mimi Marinho',
      tipo: 'CRAS',
      endereco: 'Rua Hélio Arruda Coelho, 120 – Dom Expedito',
      telefone: '(88) 3677-1410',
      horario: 'Seg a Sex: 08h às 17h',
      bairro: 'Dom Expedito'
    },
    {
      id: 'cras-dom-jose',
      secretaria_id: 'sedhas',
      nome: 'CRAS Dom José',
      tipo: 'CRAS',
      endereco: 'Rua Manoel Marinho, 1266 – Padre Ibiapina',
      telefone: '(88) 3677-1411',
      horario: 'Seg a Sex: 08h às 17h',
      bairro: 'Padre Ibiapina'
    },
    {
      id: 'cras-irma-oswalda',
      secretaria_id: 'sedhas',
      nome: 'CRAS Irmã Oswalda',
      tipo: 'CRAS',
      endereco: 'Rua Olavo Bilac, s/n – Alto da Brasília',
      telefone: '(88) 3677-1412',
      horario: 'Seg a Sex: 08h às 17h',
      bairro: 'Alto da Brasília'
    },
    {
      id: 'cras-regina-justa',
      secretaria_id: 'sedhas',
      nome: 'CRAS Regina Justa',
      tipo: 'CRAS',
      endereco: 'Rua Jerusalém, s/n – Vila União',
      telefone: '(88) 3677-1413',
      horario: 'Seg a Sex: 08h às 17h',
      bairro: 'Vila União'
    },
    {
      id: 'cras-aracatiacu',
      secretaria_id: 'sedhas',
      nome: 'CRAS Aracatiaçu',
      tipo: 'CRAS',
      endereco: 'Rua Maria Ursula Vasconcelos, s/n – Aracatiaçu',
      telefone: '(88) 3677-1414',
      horario: 'Seg a Sex: 08h às 17h',
      bairro: 'Aracatiaçu'
    },
    {
      id: 'cras-jaibaras',
      secretaria_id: 'sedhas',
      nome: 'CRAS Jaibaras',
      tipo: 'CRAS',
      endereco: 'Rua do Comércio, 590 – Jaibaras',
      telefone: '(88) 3677-1415',
      horario: 'Seg a Sex: 08h às 17h',
      bairro: 'Jaibaras'
    },
    {
      id: 'creas-sobral',
      secretaria_id: 'sedhas',
      nome: 'CREAS Sobral',
      tipo: 'CREAS',
      endereco: 'Av. Dr. Guarany, 364 – Jocely Dantas',
      telefone: '(88) 3677-1420',
      horario: 'Seg a Sex: 08h às 17h',
      bairro: 'Jocely Dantas'
    },
    {
      id: 'centro-pop',
      secretaria_id: 'sedhas',
      nome: 'Centro POP',
      tipo: 'Centro POP',
      endereco: 'Av. Dom José, 2147 – Centro',
      telefone: '(88) 3677-1430',
      horario: 'Seg a Sex: 08h às 17h',
      bairro: 'Centro'
    },

    // --- FINANÇAS (SEFIN) ---
    {
      id: 'sede-sefin',
      secretaria_id: 'sefin',
      nome: 'Sede da Secretaria das Finanças',
      tipo: 'Sede Administrativa',
      endereco: 'Rua Viriato de Medeiros, 1250 – Centro',
      telefone: '(88) 3677-1500',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Centro'
    },

    // --- PLANEJAMENTO (SEPLAG) ---
    {
      id: 'sede-prefeitura',
      secretaria_id: 'seplag',
      nome: 'Sede da Prefeitura de Sobral',
      tipo: 'Sede Administrativa',
      endereco: 'Rua Viriato de Medeiros, 1250 – Centro',
      telefone: '(88) 3677-1100',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Centro'
    },

    // --- INFRAESTRUTURA (SEINFRA) ---
    {
      id: 'sede-seinfra',
      secretaria_id: 'seinfra',
      nome: 'Sede da Secretaria de Infraestrutura',
      tipo: 'Sede Administrativa',
      endereco: 'Centro – Sobral',
      telefone: '(88) 3677-1600',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Centro'
    },

    // --- URBANISMO (SEUMA) ---
    {
      id: 'sede-seuma',
      secretaria_id: 'seuma',
      nome: 'Sede da SEUMA',
      tipo: 'Sede Administrativa',
      endereco: 'Centro – Sobral',
      telefone: '(88) 3677-1700',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Centro'
    },

    // --- TRÂNSITO (SETRAN) ---
    {
      id: 'sede-setran',
      secretaria_id: 'setran',
      nome: 'Sede da Secretaria do Trânsito',
      tipo: 'Sede Administrativa',
      endereco: 'Centro – Sobral',
      telefone: '(88) 3677-1800',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Centro'
    },

    // --- TRANSPORTE (SETRANSP) ---
    {
      id: 'sede-setransp',
      secretaria_id: 'setransp',
      nome: 'Terminal Rodoviário de Sobral',
      tipo: 'Terminal',
      endereco: 'Av. John Sanford – Junco',
      telefone: '(88) 3677-1810',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Junco'
    },

    // --- TRABALHO (STDE) ---
    {
      id: 'sede-stde',
      secretaria_id: 'stde',
      nome: 'Sede da Sec. do Trabalho e Desenvolvimento',
      tipo: 'Sede Administrativa',
      endereco: 'Centro – Sobral',
      telefone: '(88) 3677-1900',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Centro'
    },

    // --- CULTURA (SEJUC) ---
    {
      id: 'sede-sejuc',
      secretaria_id: 'sejuc',
      nome: 'Sede da Sec. Juventude e Cultura',
      tipo: 'Sede Administrativa',
      endereco: 'Centro – Sobral',
      telefone: '(88) 3677-2000',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Centro'
    },

    // --- ESPORTE (SESPOL) ---
    {
      id: 'areninha-centro',
      secretaria_id: 'sespol',
      nome: 'Areninha do Centro',
      tipo: 'Equipamento Esportivo',
      endereco: 'Centro – Sobral',
      telefone: '(88) 3677-2100',
      horario: 'Seg a Sáb: 06h às 22h',
      bairro: 'Centro'
    },
    {
      id: 'areninha-sinhazinha',
      secretaria_id: 'sespol',
      nome: 'Areninha do Sinhá Sabóia',
      tipo: 'Equipamento Esportivo',
      endereco: 'Sinhá Sabóia – Sobral',
      telefone: '(88) 3677-2101',
      horario: 'Seg a Sáb: 06h às 22h',
      bairro: 'Sinhá Sabóia'
    },

    // --- AGRICULTURA (SEAGRI) ---
    {
      id: 'sede-seagri',
      secretaria_id: 'seagri',
      nome: 'Sede da Secretaria da Agricultura',
      tipo: 'Sede Administrativa',
      endereco: 'Centro – Sobral',
      telefone: '(88) 3677-2200',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Centro'
    },

    // --- TURISMO (SETUR) ---
    {
      id: 'sede-setur',
      secretaria_id: 'setur',
      nome: 'Sede da Secretaria do Turismo',
      tipo: 'Sede Administrativa',
      endereco: 'Centro – Sobral',
      telefone: '(88) 3677-2300',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Centro'
    },

    // --- SEGURANÇA (SESEC) ---
    {
      id: 'guarda-municipal',
      secretaria_id: 'sesec',
      nome: 'Guarda Municipal de Sobral',
      tipo: 'Sede Administrativa',
      endereco: 'Centro – Sobral',
      telefone: '(88) 3677-2400',
      horario: '24 horas',
      bairro: 'Centro'
    },

    // --- PROCURADORIA (PGM) ---
    {
      id: 'sede-pgm',
      secretaria_id: 'pgm',
      nome: 'Procuradoria Geral do Município',
      tipo: 'Sede Administrativa',
      endereco: 'Rua Viriato de Medeiros, 1250 – Centro',
      telefone: '(88) 3677-2500',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Centro'
    },

    // --- SAAE ---
    {
      id: 'sede-saae',
      secretaria_id: 'saae',
      nome: 'Sede do SAAE',
      tipo: 'Autarquia',
      endereco: 'Av. John Sanford, 1700 – Junco',
      telefone: '(88) 3611-1234',
      horario: 'Seg a Sex: 08h às 14h',
      bairro: 'Junco'
    }
  ],

  /* ----------------------------------------
     SERVIÇOS POR EQUIPAMENTO
     ---------------------------------------- */
  servicos: [
    // --- CSF (Saúde da Família) - serviços comuns ---
    { id: 's001', equipamento_id: 'csf-alto-brasilia', nome: 'Consulta Médica', duracao: 30, descricao: 'Consulta médica com clínico geral' },
    { id: 's002', equipamento_id: 'csf-alto-brasilia', nome: 'Consulta de Enfermagem', duracao: 20, descricao: 'Consulta com enfermeiro(a)' },
    { id: 's003', equipamento_id: 'csf-alto-brasilia', nome: 'Vacinação', duracao: 15, descricao: 'Aplicação de vacinas do calendário' },
    { id: 's004', equipamento_id: 'csf-alto-brasilia', nome: 'Pré-natal', duracao: 30, descricao: 'Acompanhamento de gestantes' },
    { id: 's005', equipamento_id: 'csf-alto-brasilia', nome: 'Curativo', duracao: 15, descricao: 'Realização de curativos' },
    { id: 's006', equipamento_id: 'csf-alto-brasilia', nome: 'Exames Laboratoriais', duracao: 15, descricao: 'Coleta de material para exames' },

    { id: 's007', equipamento_id: 'csf-luciano', nome: 'Consulta Médica', duracao: 30, descricao: 'Consulta médica com clínico geral' },
    { id: 's008', equipamento_id: 'csf-luciano', nome: 'Consulta de Enfermagem', duracao: 20, descricao: 'Consulta com enfermeiro(a)' },
    { id: 's009', equipamento_id: 'csf-luciano', nome: 'Vacinação', duracao: 15, descricao: 'Aplicação de vacinas do calendário' },
    { id: 's010', equipamento_id: 'csf-luciano', nome: 'Pré-natal', duracao: 30, descricao: 'Acompanhamento de gestantes' },
    { id: 's011', equipamento_id: 'csf-luciano', nome: 'Teste Rápido', duracao: 15, descricao: 'Testes rápidos (HIV, Sífilis, Hepatites)' },

    { id: 's012', equipamento_id: 'csf-joao-abdelmoumem', nome: 'Consulta Médica', duracao: 30, descricao: 'Consulta médica com clínico geral' },
    { id: 's013', equipamento_id: 'csf-joao-abdelmoumem', nome: 'Vacinação', duracao: 15, descricao: 'Aplicação de vacinas do calendário' },
    { id: 's014', equipamento_id: 'csf-joao-abdelmoumem', nome: 'Puericultura', duracao: 30, descricao: 'Acompanhamento infantil' },

    { id: 's015', equipamento_id: 'csf-dom-expedito', nome: 'Consulta Médica', duracao: 30, descricao: 'Consulta médica com clínico geral' },
    { id: 's016', equipamento_id: 'csf-dom-expedito', nome: 'Vacinação', duracao: 15, descricao: 'Aplicação de vacinas do calendário' },
    { id: 's017', equipamento_id: 'csf-dom-expedito', nome: 'Pré-natal', duracao: 30, descricao: 'Acompanhamento de gestantes' },

    // --- CEO ---
    { id: 's018', equipamento_id: 'ceo-sobral', nome: 'Endodontia', duracao: 60, descricao: 'Tratamento de canal' },
    { id: 's019', equipamento_id: 'ceo-sobral', nome: 'Cirurgia Oral', duracao: 45, descricao: 'Procedimentos cirúrgicos odontológicos' },
    { id: 's020', equipamento_id: 'ceo-sobral', nome: 'Periodontia', duracao: 45, descricao: 'Tratamento de gengivas' },
    { id: 's021', equipamento_id: 'ceo-sobral', nome: 'Prótese Dentária', duracao: 30, descricao: 'Confecção e ajuste de próteses' },

    // --- CAPS ---
    { id: 's022', equipamento_id: 'caps-sobral', nome: 'Acolhimento', duracao: 45, descricao: 'Acolhimento inicial em saúde mental' },
    { id: 's023', equipamento_id: 'caps-sobral', nome: 'Consulta Psiquiátrica', duracao: 30, descricao: 'Consulta com psiquiatra' },
    { id: 's024', equipamento_id: 'caps-sobral', nome: 'Atendimento Psicológico', duracao: 50, descricao: 'Sessão com psicólogo(a)' },
    { id: 's025', equipamento_id: 'caps-sobral', nome: 'Terapia em Grupo', duracao: 60, descricao: 'Sessões de terapia coletiva' },

    // --- SEDE SMS ---
    { id: 's026', equipamento_id: 'sede-sms', nome: 'Cartão SUS', duracao: 15, descricao: 'Emissão e atualização do Cartão SUS' },
    { id: 's027', equipamento_id: 'sede-sms', nome: 'Ouvidoria da Saúde', duracao: 20, descricao: 'Registro de reclamações e sugestões' },

    // --- EDUCAÇÃO ---
    { id: 's028', equipamento_id: 'sede-sme', nome: 'Matrícula Escolar', duracao: 30, descricao: 'Matrícula na rede municipal de ensino' },
    { id: 's029', equipamento_id: 'sede-sme', nome: 'Transferência Escolar', duracao: 20, descricao: 'Solicitação de transferência entre escolas' },
    { id: 's030', equipamento_id: 'sede-sme', nome: 'Declaração de Escolaridade', duracao: 15, descricao: 'Emissão de declarações e certidões' },
    { id: 's031', equipamento_id: 'sede-sme', nome: 'Transporte Escolar', duracao: 20, descricao: 'Cadastro no transporte escolar municipal' },

    // --- CASA DO CIDADÃO ---
    { id: 's032', equipamento_id: 'casa-cidadao', nome: 'Cadastro Único (CadÚnico)', duracao: 45, descricao: 'Inscrição e atualização do Cadastro Único' },
    { id: 's033', equipamento_id: 'casa-cidadao', nome: 'Bolsa Família', duracao: 30, descricao: 'Consulta e atualização Bolsa Família' },
    { id: 's034', equipamento_id: 'casa-cidadao', nome: 'Emissão de RG', duracao: 20, descricao: 'Agendamento para carteira de identidade' },
    { id: 's035', equipamento_id: 'casa-cidadao', nome: 'CPF', duracao: 15, descricao: 'Regularização e emissão de CPF' },
    { id: 's036', equipamento_id: 'casa-cidadao', nome: 'Certidão de Nascimento', duracao: 20, descricao: 'Segunda via de certidão' },

    // --- CRAS (serviços comuns) ---
    { id: 's037', equipamento_id: 'cras-mimi', nome: 'Cadastro Único', duracao: 45, descricao: 'Cadastro e atualização CadÚnico' },
    { id: 's038', equipamento_id: 'cras-mimi', nome: 'Atendimento Social', duracao: 30, descricao: 'Atendimento com assistente social' },
    { id: 's039', equipamento_id: 'cras-mimi', nome: 'BPC/LOAS', duracao: 30, descricao: 'Benefício de Prestação Continuada' },
    { id: 's040', equipamento_id: 'cras-mimi', nome: 'Oficinas SCFV', duracao: 60, descricao: 'Serviço de Convivência e Fortalecimento de Vínculos' },

    { id: 's041', equipamento_id: 'cras-dom-jose', nome: 'Cadastro Único', duracao: 45, descricao: 'Cadastro e atualização CadÚnico' },
    { id: 's042', equipamento_id: 'cras-dom-jose', nome: 'Atendimento Social', duracao: 30, descricao: 'Atendimento com assistente social' },
    { id: 's043', equipamento_id: 'cras-dom-jose', nome: 'BPC/LOAS', duracao: 30, descricao: 'Benefício de Prestação Continuada' },

    { id: 's044', equipamento_id: 'cras-irma-oswalda', nome: 'Cadastro Único', duracao: 45, descricao: 'Cadastro e atualização CadÚnico' },
    { id: 's045', equipamento_id: 'cras-irma-oswalda', nome: 'Atendimento Social', duracao: 30, descricao: 'Atendimento com assistente social' },

    { id: 's046', equipamento_id: 'cras-regina-justa', nome: 'Cadastro Único', duracao: 45, descricao: 'Cadastro e atualização CadÚnico' },
    { id: 's047', equipamento_id: 'cras-regina-justa', nome: 'Atendimento Social', duracao: 30, descricao: 'Atendimento com assistente social' },

    { id: 's048', equipamento_id: 'cras-aracatiacu', nome: 'Cadastro Único', duracao: 45, descricao: 'Cadastro e atualização CadÚnico' },
    { id: 's049', equipamento_id: 'cras-aracatiacu', nome: 'Atendimento Social', duracao: 30, descricao: 'Atendimento com assistente social' },

    { id: 's050', equipamento_id: 'cras-jaibaras', nome: 'Cadastro Único', duracao: 45, descricao: 'Cadastro e atualização CadÚnico' },
    { id: 's051', equipamento_id: 'cras-jaibaras', nome: 'Atendimento Social', duracao: 30, descricao: 'Atendimento com assistente social' },

    // --- CREAS ---
    { id: 's052', equipamento_id: 'creas-sobral', nome: 'Acolhimento CREAS', duracao: 45, descricao: 'Acolhimento de pessoas com direitos violados' },
    { id: 's053', equipamento_id: 'creas-sobral', nome: 'Medidas Socioeducativas', duracao: 30, descricao: 'Acompanhamento de medidas socioeducativas' },
    { id: 's054', equipamento_id: 'creas-sobral', nome: 'Atendimento Jurídico', duracao: 30, descricao: 'Orientação jurídica social' },

    // --- CENTRO POP ---
    { id: 's055', equipamento_id: 'centro-pop', nome: 'Acolhimento', duracao: 30, descricao: 'Acolhimento de pessoas em situação de rua' },
    { id: 's056', equipamento_id: 'centro-pop', nome: 'Higiene e Alimentação', duracao: 20, descricao: 'Acesso a banho, alimentação e higiene' },

    // --- FINANÇAS ---
    { id: 's057', equipamento_id: 'sede-sefin', nome: 'IPTU – Consulta e Emissão', duracao: 15, descricao: 'Guia de IPTU, parcelamento e isenção' },
    { id: 's058', equipamento_id: 'sede-sefin', nome: 'ISS – Nota Fiscal', duracao: 20, descricao: 'Nota fiscal avulsa e ISS' },
    { id: 's059', equipamento_id: 'sede-sefin', nome: 'ITBI', duracao: 20, descricao: 'Imposto sobre Transmissão de Bens Imóveis' },
    { id: 's060', equipamento_id: 'sede-sefin', nome: 'Certidão Negativa de Débitos', duracao: 10, descricao: 'Emissão de certidão negativa' },
    { id: 's061', equipamento_id: 'sede-sefin', nome: 'Alvará de Funcionamento', duracao: 30, descricao: 'Emissão e renovação de alvará' },

    // --- SEPLAG ---
    { id: 's062', equipamento_id: 'sede-prefeitura', nome: 'Protocolo Geral', duracao: 15, descricao: 'Registro de documentos e requerimentos' },
    { id: 's063', equipamento_id: 'sede-prefeitura', nome: 'Ouvidoria Municipal', duracao: 20, descricao: 'Registro de reclamações, elogios e sugestões' },

    // --- SEUMA ---
    { id: 's064', equipamento_id: 'sede-seuma', nome: 'Alvará de Construção', duracao: 30, descricao: 'Licenciamento para construção' },
    { id: 's065', equipamento_id: 'sede-seuma', nome: 'Habite-se', duracao: 20, descricao: 'Certificado de conclusão de obra' },
    { id: 's066', equipamento_id: 'sede-seuma', nome: 'Licenciamento Ambiental', duracao: 30, descricao: 'Licença ambiental para atividades' },
    { id: 's067', equipamento_id: 'sede-seuma', nome: 'Consulta de Zoneamento', duracao: 15, descricao: 'Informações sobre uso e ocupação do solo' },

    // --- SETRAN ---
    { id: 's068', equipamento_id: 'sede-setran', nome: 'Recurso de Multa', duracao: 20, descricao: 'Solicitação de recurso contra multa' },
    { id: 's069', equipamento_id: 'sede-setran', nome: 'Solicitação de Sinalização', duracao: 15, descricao: 'Pedido de instalação/manutenção de sinalização' },
    { id: 's070', equipamento_id: 'sede-setran', nome: 'Permissão de Estacionamento', duracao: 15, descricao: 'Cartão de estacionamento especial' },

    // --- SETRANSP ---
    { id: 's071', equipamento_id: 'sede-setransp', nome: 'Cartão Estudantil', duracao: 20, descricao: 'Emissão de cartão de transporte estudantil' },
    { id: 's072', equipamento_id: 'sede-setransp', nome: 'Passe Livre', duracao: 20, descricao: 'Solicitação de passe livre' },
    { id: 's073', equipamento_id: 'sede-setransp', nome: 'Reclamação de Transporte', duracao: 15, descricao: 'Reclamação sobre transporte público' },

    // --- STDE ---
    { id: 's074', equipamento_id: 'sede-stde', nome: 'Carteira de Trabalho Digital', duracao: 20, descricao: 'Orientação sobre CTPS Digital' },
    { id: 's075', equipamento_id: 'sede-stde', nome: 'Seguro-Desemprego', duracao: 30, descricao: 'Orientação sobre seguro-desemprego' },
    { id: 's076', equipamento_id: 'sede-stde', nome: 'Cursos de Capacitação', duracao: 20, descricao: 'Inscrição em cursos profissionalizantes' },
    { id: 's077', equipamento_id: 'sede-stde', nome: 'MEI – Microempreendedor', duracao: 30, descricao: 'Orientação para abrir ou atualizar MEI' },

    // --- ESPORTE ---
    { id: 's078', equipamento_id: 'areninha-centro', nome: 'Reserva de Quadra', duracao: 60, descricao: 'Agendamento de quadra poliesportiva' },
    { id: 's079', equipamento_id: 'areninha-centro', nome: 'Inscrição em Escolinhas', duracao: 20, descricao: 'Matrícula em escolinhas esportivas' },
    { id: 's080', equipamento_id: 'areninha-sinhazinha', nome: 'Reserva de Quadra', duracao: 60, descricao: 'Agendamento de quadra poliesportiva' },
    { id: 's081', equipamento_id: 'areninha-sinhazinha', nome: 'Inscrição em Escolinhas', duracao: 20, descricao: 'Matrícula em escolinhas esportivas' },

    // --- AGRICULTURA ---
    { id: 's082', equipamento_id: 'sede-seagri', nome: 'DAP – Declaração de Aptidão', duracao: 30, descricao: 'Emissão de DAP para agricultores' },
    { id: 's083', equipamento_id: 'sede-seagri', nome: 'PRONAF', duracao: 30, descricao: 'Orientação sobre financiamento rural' },
    { id: 's084', equipamento_id: 'sede-seagri', nome: 'Assistência Técnica Rural', duracao: 30, descricao: 'Agendamento de visita técnica' },

    // --- SAAE ---
    { id: 's085', equipamento_id: 'sede-saae', nome: 'Ligação de Água', duracao: 20, descricao: 'Solicitação de nova ligação de água' },
    { id: 's086', equipamento_id: 'sede-saae', nome: 'Ligação de Esgoto', duracao: 20, descricao: 'Solicitação de ligação de esgoto' },
    { id: 's087', equipamento_id: 'sede-saae', nome: 'Segunda Via de Conta', duracao: 10, descricao: 'Emissão de segunda via' },
    { id: 's088', equipamento_id: 'sede-saae', nome: 'Reparo/Vazamento', duracao: 15, descricao: 'Solicitação de reparo na rede' },
    { id: 's089', equipamento_id: 'sede-saae', nome: 'Troca de Hidrômetro', duracao: 15, descricao: 'Solicitação de troca de hidrômetro' },

    // --- PGM ---
    { id: 's090', equipamento_id: 'sede-pgm', nome: 'Consulta Processual', duracao: 20, descricao: 'Consulta sobre processos municipais' },
    { id: 's091', equipamento_id: 'sede-pgm', nome: 'Parecer Jurídico', duracao: 30, descricao: 'Solicitação de parecer jurídico' },

    // --- SEGURANÇA ---
    { id: 's092', equipamento_id: 'guarda-municipal', nome: 'Boletim de Ocorrência', duracao: 20, descricao: 'Registro de B.O. municipal' },
    { id: 's093', equipamento_id: 'guarda-municipal', nome: 'Solicitação de Ronda', duracao: 10, descricao: 'Pedido de ronda em logradouros' },

    // --- CULTURA ---
    { id: 's094', equipamento_id: 'sede-sejuc', nome: 'Inscrição em Oficinas Culturais', duracao: 20, descricao: 'Matrícula em oficinas de arte e cultura' },
    { id: 's095', equipamento_id: 'sede-sejuc', nome: 'Uso de Espaço Cultural', duracao: 30, descricao: 'Reserva de espaço para eventos culturais' },

    // --- TURISMO ---
    { id: 's096', equipamento_id: 'sede-setur', nome: 'Informações Turísticas', duracao: 15, descricao: 'Orientação sobre pontos turísticos' },
    { id: 's097', equipamento_id: 'sede-setur', nome: 'Cadastro de Eventos', duracao: 20, descricao: 'Cadastro de eventos na agenda municipal' },

    // --- SEINFRA ---
    { id: 's098', equipamento_id: 'sede-seinfra', nome: 'Solicitação de Tapa-buraco', duracao: 10, descricao: 'Pedido de reparo em vias públicas' },
    { id: 's099', equipamento_id: 'sede-seinfra', nome: 'Iluminação Pública', duracao: 10, descricao: 'Solicitação de reparo em iluminação' },
    { id: 's100', equipamento_id: 'sede-seinfra', nome: 'Limpeza de Terreno', duracao: 15, descricao: 'Solicitação de limpeza de terreno público' }
  ],

  /* ----------------------------------------
     SLOTS DE HORÁRIO PADRÃO
     ---------------------------------------- */
  horariosBase: {
    manha: [
      '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
      '10:00', '10:30', '11:00', '11:30'
    ],
    tarde: [
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30'
    ],
    administrativo: [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'
    ]
  },

  /* ----------------------------------------
     CONFIGURAÇÕES
     ---------------------------------------- */
  config: {
    maxAgendamentosPorSlot: 10,
    diasAntecedenciaMax: 30,
    diasAntecedenciaMin: 1,
    horarioFuncionamentoPadrao: {
      inicio: '08:00',
      fim: '14:00',
      diasSemana: [1, 2, 3, 4, 5] // Seg a Sex
    },
    feriados2025: [
      '2025-01-01', '2025-02-20', '2025-03-31',
      '2025-04-18', '2025-04-21', '2025-05-01',
      '2025-06-19', '2025-09-07', '2025-10-12',
      '2025-11-02', '2025-11-15', '2025-11-20',
      '2025-12-25'
    ]
  },

  /* ----------------------------------------
     ÍCONES SVG (inline)
     ---------------------------------------- */
  icones: {
    health: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    school: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
    analytics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>',
    finance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
    build: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>',
    nature: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8c.7-.7 1-1.6 1-2.5S17.7 3.7 17 3c-.7.7-1 1.6-1 2.5S16.3 7.3 17 8z"/><path d="M12.6 6.2c-1.1.5-2 1.5-2.3 2.7-.5 1.7.2 3.5 1.6 4.4"/><path d="M2 22l10-10"/><path d="M9 7.5C9 9 10 11 12 13c1.2-1.2 2-3.1 2-5 0-3-2.5-5-5-5-2.6 0-5 2-5 5 0 2 .8 3.8 2 5"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    traffic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="1" width="12" height="22" rx="2"/><circle cx="12" cy="7" r="2"/><circle cx="12" cy="13" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
    bus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M7 18a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H9a2 2 0 00-2 2v14z"/></svg>',
    work: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7H17c2.8 0 5-2.2 5-5 0-5.5-4.5-9.6-10-9.4z"/></svg>',
    sports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 000 20 14.5 14.5 0 000-20"/><path d="M2 12h20"/></svg>',
    agriculture: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0020 0h-3"/><path d="M8 5.2C9 3.8 10.4 3 12 3s3 .8 4 2.2"/></svg>',
    tour: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    gavel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2l6 6-8 8-6-6 8-8z"/><path d="M3 21l3.5-3.5"/><path d="M7.5 7.5L3 12l3 3 4.5-4.5"/></svg>',
    water: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    location: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    printer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 013-3h14a3 3 0 013 3"/><path d="M2 9a3 3 0 003 3h0a3 3 0 003-3"/><path d="M16 9a3 3 0 003 3h0a3 3 0 003-3"/><path d="M2 9v6a3 3 0 003 3h14a3 3 0 003-3V9"/><line x1="9" y1="12" x2="15" y2="12"/></svg>',
    volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>'
  },

  /* ----------------------------------------
     ADMIN PADRÃO
     ---------------------------------------- */
  adminPadrao: [
    {
      id: 'admin-001',
      nome: 'Administrador Geral',
      email: 'admin@sobral.ce.gov.br',
      senha: 'admin123',
      role: 'super_admin',
      equipamento_ids: []
    }
  ]
};
