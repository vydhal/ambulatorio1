const ABA_CADASTRO = "Cadastro de Animais"; 
const ABA_HISTORICO = "Histórico Médico"; 
const ABA_CONFIGURACOES = "Configurações"; 
const ABA_ESPECIES = "Espécies"; 
const ABA_MEDICACOES = "Medicamentos"; 
const COLUNA_ID = 1; // Coluna do ID na aba de Cadastro (Coluna A)

// Variável global para armazenar o ID do animal (usado em outras partes do seu script)
let animalIdParaMedicacao; 

// --- FUNÇÕES DE SUPORTE ---

/**
 * Retorna uma lista de nomes de espécies da aba "Configurações" (Coluna C).
 * @return {string[]} Uma array de strings com os nomes das espécies.
 */
function getListaEspecies() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaConfiguracoes = ss.getSheetByName(ABA_CONFIGURACOES); 
  if (!abaConfiguracoes) {
    Logger.log('Erro: Aba "' + ABA_CONFIGURACOES + '" não encontrada. Por favor, crie uma aba com este nome.');
    return [];
  }
  // Assume que as espécies estão na Coluna C e começa da segunda linha (para ignorar cabeçalho)
  var colunaEspecies = abaConfiguracoes.getRange("C:C").getValues().flat().filter(String);
  if (colunaEspecies.length > 0) {
    // Remove o cabeçalho se a primeira linha não for uma espécie
    // Uma forma mais robusta seria verificar se a primeira célula é "Espécies" ou similar
    // Por enquanto, apenas remove a primeira linha presumindo que é cabeçalho.
    colunaEspecies.shift(); 
  }
  return colunaEspecies.sort(); 
}

/**
 * Retorna uma lista de nomes de medicações da aba "Configurações" (Coluna A).
 * @return {string[]} Uma array de strings com os nomes das medicações.
 */
function getListaMedicacoes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaConfiguracoes = ss.getSheetByName(ABA_CONFIGURACOES);
  if (!abaConfiguracoes) {
    Logger.log('Erro: Aba "' + ABA_CONFIGURACOES + '" não encontrada.');
    return [];
  }
  // Assume que as medicações estão na Coluna A e começa da segunda linha
  var colunaMedicacoes = abaConfiguracoes.getRange("A:A").getValues().flat().filter(String);
  if (colunaMedicacoes.length > 0) {
    colunaMedicacoes.shift(); 
  }
  return colunaMedicacoes.sort(); 
}

/**
 * Retorna uma lista de nomes de veterinários da aba "Configurações" (Coluna D).
 * @return {string[]} Uma array de strings com os nomes dos veterinários.
 */
function getListaVeterinarios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaConfiguracoes = ss.getSheetByName(ABA_CONFIGURACOES);
  if (!abaConfiguracoes) {
    Logger.log('Erro: Aba "' + ABA_CONFIGURACOES + '" não encontrada.');
    return [];
  }
  // Assume que os veterinários estão na Coluna D e começa da segunda linha
  var colunaVeterinarios = abaConfiguracoes.getRange("D:D").getValues().flat().filter(String);
  if (colunaVeterinarios.length > 0) {
    colunaVeterinarios.shift();
  }
  return colunaVeterinarios.sort();
}

/**
 * Retorna uma lista de todos os tutores cadastrados (Nome e CPF).
 * Usado para preencher o dropdown no formulário de cadastro de animal.
 * @return {Object[]} Uma array de objetos {nome: string, cpf: string}.
 */
function getListaTutores() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaCadastro = ss.getSheetByName(ABA_CADASTRO);

  if (!abaCadastro) {
    Logger.log('Erro: Aba "' + ABA_CADASTRO + '" não encontrada. Verifique o nome da aba.');
    return [];
  }

  var dados = abaCadastro.getDataRange().getValues(); 

  if (dados.length < 2) { // Considera que a primeira linha é o cabeçalho
    return []; 
  }

  var listaTutores = [];
  var cpfsJaAdicionados = {}; 

  var cabecalho = dados[0];

  var colTutorNome = cabecalho.indexOf("Nome do Tutor");
  var colTutorCpf = cabecalho.indexOf("cpf tutor"); 

  if (colTutorNome === -1 || colTutorCpf === -1) {
    Logger.log('Erro: Colunas "Nome do Tutor" ou "cpf tutor" não encontradas na aba "' + ABA_CADASTRO + '". Verifique os cabeçalhos.');
    return [];
  }

  for (var i = 1; i < dados.length; i++) {
    var tutorNome = dados[i][colTutorNome];
    var tutorCpf = dados[i][colTutorCpf];

    var cpfNormalizado = tutorCpf ? String(tutorCpf).replace(/[^0-9]/g, '') : '';

    if (tutorNome && cpfNormalizado && !cpfsJaAdicionados[cpfNormalizado]) {
      listaTutores.push({ nome: tutorNome, cpf: cpfNormalizado });
      cpfsJaAdicionados[cpfNormalizado] = true;
    }
  }
  return listaTutores;
}

/**
 * Busca os dados completos de um tutor pelo CPF.
 * @param {string} cpf O CPF do tutor a ser buscado.
 * @return {Object} Um objeto com os dados do tutor (nome, telefone, email, cpf, endereco), ou null se não encontrado.
 */
function getDadosTutorPorCpf(cpf) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaCadastro = ss.getSheetByName(ABA_CADASTRO);

  if (!abaCadastro) {
    Logger.log('Erro: Aba "' + ABA_CADASTRO + '" não encontrada.');
    return null;
  }

  var dados = abaCadastro.getDataRange().getValues();
  if (dados.length < 2) { 
    return null; 
  }

  var cabecalho = dados[0];

  var colTutorNome = cabecalho.indexOf("Nome do Tutor");
  var colTutorTelefone = cabecalho.indexOf("Telefone do Tutor");
  var colTutorEmail = cabecalho.indexOf("Email do Tutor");
  var colTutorCpf = cabecalho.indexOf("cpf tutor"); 
  var colTutorEndereco = cabecalho.indexOf("ENDEREÇO"); 

  if (colTutorNome === -1 || colTutorTelefone === -1 || colTutorEmail === -1 || colTutorCpf === -1 || colTutorEndereco === -1) {
    Logger.log('Erro: Uma ou mais colunas de tutor não foram encontradas na aba "' + ABA_CADASTRO + '". Verifique os cabeçalhos: "Nome do Tutor", "Telefone do Tutor", "Email do Tutor", "cpf tutor", "ENDEREÇO".');
    return null;
  }

  var cpfNormalizadoBusca = cpf ? String(cpf).replace(/[^0-9]/g, '') : '';

  for (var i = 1; i < dados.length; i++) { 
    var cpfPlanilha = dados[i][colTutorCpf];
    var cpfPlanilhaNormalizado = cpfPlanilha ? String(cpfPlanilha).replace(/[^0-9]/g, '') : '';

    if (cpfPlanilhaNormalizado === cpfNormalizadoBusca) {
      return {
        nome: dados[i][colTutorNome],
        telefone: dados[i][colTutorTelefone],
        email: dados[i][colTutorEmail],
        cpf: dados[i][colTutorCpf], 
        endereco: dados[i][colTutorEndereco]
      };
    }
  }
  return null; 
}

/**
 * Gera o próximo ID sequencial formatado para 3 dígitos.
 */
function gerarProximoId() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaCadastro = ss.getSheetByName(ABA_CADASTRO);
  // Pega os IDs da coluna 'ID' (COLUNA_ID-1 para índice base 0)
  // Certifique-se de que a coluna de ID só contenha IDs numéricos ou vazios para esta função
  var ids = abaCadastro.getRange(2, COLUNA_ID, abaCadastro.getLastRow() - 1, 1).getValues().flat().filter(String); 

  if (ids.length === 0) {
    return "001";
  }

  // Encontra o maior ID numérico para garantir a sequência correta
  var maiorIdNum = 0;
  ids.forEach(function(idStr) {
    var idNum = parseInt(idStr, 10);
    if (!isNaN(idNum) && idNum > maiorIdNum) {
      maiorIdNum = idNum;
    }
  });

  var proximoIdNum = maiorIdNum + 1;
  return proximoIdNum.toString().padStart(3, '0'); 
}


// --- FUNÇÕES DE INTERFACE E CADASTRO ---

function onOpen() {
  Logger.log("Função onOpen() sendo executada.");
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Gestão Clínica')
      .addItem('Cadastrar Novo Animal', 'mostrarFormularioCadastro')
      .addItem('Consultar Animal', 'solicitarIdParaConsultaAnimalInfo') // <--- ESTA LINHA DEVE ESTAR ASSIM
      .addItem('Registrar Consulta Ambulatório 1', 'mostrarFormularioConsultaAmbulatorio1')
      .addItem('Registrar Medicação (Simples)', 'solicitarIdParaMedicacao')
      .addItem('Administrar Medicação (Completo)', 'solicitarIdParaAdministrarMedicacao')
      .addToUi();
}
/**
 * Exibe o formulário para cadastro de novo animal.
 */
function mostrarFormularioCadastro() {
  var ui = SpreadsheetApp.getUi();
  var listaEspecies = getListaEspecies();
  var htmlTemplate = HtmlService.createTemplateFromFile('FormularioCadastroAnimal');
  htmlTemplate.listaEspecies = listaEspecies;
  var htmlOutput = htmlTemplate.evaluate()
      .setWidth(600)
      .setHeight(650); // Aumentei a altura para melhor visualização
  ui.showModalDialog(htmlOutput, 'Cadastrar Novo Animal');
}

/**
 * Função para cadastrar um novo animal no Sheets.
 * Recebe todos os dados do formulário HTML.
 * ATENÇÃO: A ordem dos parâmetros e do array 'novaLinha' deve corresponder à planilha.
 */
function cadastrarNovoAnimalDoFormulario(
  nome, especie, raca, sexo, porte, pelagem, peso, 
  tutorNome, tutorTelefone, tutorEmail, tutorCpf, observacoes, tutorEndereco
) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaCadastro = ss.getSheetByName(ABA_CADASTRO);

  if (!abaCadastro) {
    Logger.log('Erro: A aba "' + ABA_CADASTRO + '" não foi encontrada.');
    SpreadsheetApp.getUi().alert('Erro Crítico', 'A aba de cadastro não foi encontrada. Contate o administrador.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  var id = gerarProximoId(); 

  // Ajuste aqui se 'idade' for um novo campo no HTML e na planilha
  // Por enquanto, mantive a assinatura da função como estava no HTML original fornecido.
  // Se você adicionar 'idade' no FormularioCadastroAnimal.html, precisa adicioná-lo aqui também.
  var novaLinha = [
    id,          
    nome,        
    especie,     
    raca,        
    sexo,        
    porte,       
    pelagem,     
    peso,        
    tutorNome,   
    tutorTelefone,
    tutorEmail,  
    tutorCpf,    
    observacoes, 
    tutorEndereco,
    // idade, // Adicione aqui se o campo 'idade' for incluído no HTML e na planilha
  ];
  
  try {
    abaCadastro.appendRow(novaLinha);
    SpreadsheetApp.getUi().alert('Sucesso', 'Animal "' + nome + '" cadastrado com ID: ' + id, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    Logger.log('Erro ao cadastrar animal: ' + e.message);
    SpreadsheetApp.getUi().alert('Erro', 'Ocorreu um erro ao cadastrar o animal: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Solicita o ID do animal e, se encontrado, exibe o AnimalInfoDialog.html.
 */
function solicitarIdParaConsultaAnimalInfo() {
  var ui = SpreadsheetApp.getUi();
  var resultado = ui.prompt(
      'Consultar Animal',
      'Digite o ID do animal ou CPF do tutor:',
      ui.ButtonSet.OK_CANCEL
  );

  if (resultado.getSelectedButton() == ui.Button.OK) {
    var idOuCpf = resultado.getResponseText();
    if (idOuCpf) {
      // Chama a função que agora retornará os dados formatados para o HTML
      var dadosParaDialogo = getDadosAnimalParaDialogo(idOuCpf);

      if (dadosParaDialogo) {
        var htmlTemplate = HtmlService.createTemplateFromFile('AnimalInfoDialog');
        htmlTemplate.animal = dadosParaDialogo.animal;
        htmlTemplate.cabecalhoCadastro = dadosParaDialogo.cabecalhoCadastro;
        htmlTemplate.consultasAnimal = dadosParaDialogo.consultasAnimal;
        htmlTemplate.cabecalhoHistorico = dadosParaDialogo.cabecalhoHistorico;

        var htmlOutput = htmlTemplate.evaluate()
            .setWidth(900) // Aumente conforme a necessidade de visualização
            .setHeight(600); // Aumente conforme a necessidade de visualização
        ui.showModalDialog(htmlOutput, 'Informações do Animal (ID: ' + dadosParaDialogo.animal[0] + ')'); // Exibe o ID no título
      } else {
        ui.alert('Erro', 'Animal com ID ou CPF "' + idOuCpf + '" não encontrado.', SpreadsheetApp.getUi().ButtonSet.OK);
      }
    }
  }
}

/**
 * Busca e formata os dados do animal e seu histórico para serem exibidos no AnimalInfoDialog.html.
 * Retorna um objeto com animal[], cabecalhoCadastro[], consultasAnimal[][], cabecalhoHistorico[].
 */
function getDadosAnimalParaDialogo(idOuCpf) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaCadastro = ss.getSheetByName(ABA_CADASTRO);
  var abaHistorico = ss.getSheetByName(ABA_HISTORICO);

  if (!abaCadastro || !abaHistorico) {
    Logger.log('Erro: Abas de cadastro ou histórico não encontradas.');
    return null;
  }

  var dataCadastro = abaCadastro.getDataRange().getValues();
  var animalEncontrado = null;

  if (dataCadastro.length < 2) {
    return null; // Nenhum dado além do cabeçalho
  }

  // Tenta encontrar o animal pelo ID
  for (var i = 1; i < dataCadastro.length; i++) {
    if (dataCadastro[i][COLUNA_ID - 1] == idOuCpf) {
      animalEncontrado = dataCadastro[i];
      break;
    }
  }

  // Se não encontrou pelo ID, tenta pelo CPF do tutor
  if (!animalEncontrado) {
    var colCpfTutor = dataCadastro[0].indexOf("cpf tutor");
    if (colCpfTutor !== -1) {
        for (var i = 1; i < dataCadastro.length; i++) {
            var cpfPlanilha = String(dataCadastro[i][colCpfTutor] || '').replace(/[^0-9]/g, '');
            var cpfBusca = String(idOuCpf || '').replace(/[^0-9]/g, '');
            if (cpfPlanilha === cpfBusca) {
                animalEncontrado = dataCadastro[i];
                break; 
            }
        }
    }
  }

  if (!animalEncontrado) {
    return null; // Animal não encontrado por ID ou CPF
  }

  var cabecalhoCadastro = abaCadastro.getRange(1, 1, 1, abaCadastro.getLastColumn()).getValues()[0];
  
  // Tratamento para valores vazios/nulos no animalEncontrado antes de passar para o HTML
  for (var j = 0; j < animalEncontrado.length; j++) {
      if (animalEncontrado[j] === undefined || animalEncontrado[j] === null || String(animalEncontrado[j]).trim() === '') {
          animalEncontrado[j] = "[Não informado]";
      }
      // Formata a data de nascimento se existir no cadastro (assumindo que seja um objeto Date)
      // Ajuste o índice 'j' para a coluna correta da data de nascimento se ela estiver na aba de Cadastro
      // Exemplo: se Data de Nascimento for a coluna 4 (índice 3)
      // if (j === 3 && animalEncontrado[j] instanceof Date) { 
      //     animalEncontrado[j] = Utilities.formatDate(animalEncontrado[j], Session.getScriptTimeZone(), "dd/MM/yyyy");
      // }
  }

    var cabecalhoHistorico = abaHistorico.getRange(1, 1, 1, abaHistorico.getLastColumn()).getValues()[0];
  // O cabecalhoHistorico deve ser:
  // ["ID do Animal", "Data e Hora do Evento", "Tipo de Evento", "Medicação", "Dose", "Via de Administração", "Responsável", "Observações", "Veterinário Responsável"]

  var dataHistorico = abaHistorico.getDataRange().getValues();
  var consultasAnimal = [];

  var idAnimalParaBusca = animalEncontrado[COLUNA_ID - 1]; // O ID do animal encontrado

  var colIdHistorico = 0; 
  var colDataHoraEvento = 1; // Já estava aqui para formatação

  for (var k = 1; k < dataHistorico.length; k++) { // Começa da linha 1 para pular o cabeçalho
    if (dataHistorico[k][colIdHistorico] == idAnimalParaBusca) {
      var linhaHistorico = [];
      for (var l = 0; l < cabecalhoHistorico.length; l++) { // Itera sobre as colunas do histórico
          var valorHistorico = dataHistorico[k][l];
          
          if (l === colDataHoraEvento && valorHistorico instanceof Date) {
              valorHistorico = Utilities.formatDate(valorHistorico, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
          } else if (valorHistorico === undefined || valorHistorico === null || String(valorHistorico).trim() === '') {
              valorHistorico = "[Não informado]";
          }
          
          linhaHistorico.push(valorHistorico);
      }
      consultasAnimal.push(linhaHistorico);
    }
  }


  return {
    animal: animalEncontrado,
    cabecalhoCadastro: cabecalhoCadastro,
    consultasAnimal: consultasAnimal,
    cabecalhoHistorico: cabecalhoHistorico
  };
}


/**
 * Exibe o formulário de consulta específico para Ambulatório 1.
 */
function mostrarFormularioConsultaAmbulatorio1() {
  var ui = SpreadsheetApp.getUi();
  var resultado = ui.prompt(
      'Registrar Consulta',
      'Digite o ID do Animal para a consulta:',
      ui.ButtonSet.OK_CANCEL
  );

  if (resultado.getSelectedButton() == ui.Button.OK) {
    var idAnimalConsulta = resultado.getResponseText();
    if (idAnimalConsulta) {
      if (verificarIdAnimalCadastrado(idAnimalConsulta)) {
        var listaMedicacoes = getListaMedicacoes();
        var listaVeterinarios = getListaVeterinarios(); 
        var htmlTemplate = HtmlService.createTemplateFromFile('FormularioConsultaAmbulatorio1');
        htmlTemplate.listaMedicacoes = listaMedicacoes;
        htmlTemplate.listaVeterinarios = listaVeterinarios; 
        var htmlOutput = htmlTemplate.evaluate()
            .setWidth(600)
            .setHeight(500);
        ui.showModalDialog(htmlOutput, 'Registrar Consulta');
        // O ID do animal já é passado via prompt e validado. Não é necessário setar novamente aqui.
      } else {
        ui.alert('Erro', 'O ID "' + idAnimalConsulta + '" não está cadastrado. Por favor, cadastre o animal primeiro.', SpreadsheetApp.getUi().ButtonSet.OK);
      }
    }
  }
}

/**
 * Verifica se um ID de animal está cadastrado.
 */
function verificarIdAnimalCadastrado(idAnimal) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaCadastro = ss.getSheetByName(ABA_CADASTRO);
  if (!abaCadastro) {
    Logger.log('Erro: Aba "' + ABA_CADASTRO + '" não encontrada.');
    return false;
  }
  var dataCadastro = abaCadastro.getDataRange().getValues();
  for (var i = 1; i < dataCadastro.length; i++) {
    if (dataCadastro[i][COLUNA_ID - 1] == idAnimal) { // COLUNA_ID é 1 (A), então índice é 0
      return true; 
    }
  }
  return false; 
}

/**
 * Registra uma consulta do Ambulatório 1 na aba de Histórico Médico.
 */
function registrarConsultaAmbulatorio1(animalId, dataHoraConsulta, observacoes, precisaRetorno, dataHoraRetorno, medicacoes, medicacaoPrescritaTexto, veterinario) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaHistorico = ss.getSheetByName(ABA_HISTORICO);
  if (!abaHistorico) {
    SpreadsheetApp.getUi().alert('Erro', 'A aba "Histórico Médico" não foi encontrada.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  // Formata a data/hora da consulta
  var dataHoraConsultaFormatada = Utilities.formatDate(new Date(dataHoraConsulta), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
  // Formata a data/hora de retorno, se aplicável
  var dataHoraRetornoFormatada = precisaRetorno ? Utilities.formatDate(new Date(dataHoraRetorno), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm") : "";

  // Vamos usar as colunas específicas para Medicacao e Observacoes da consulta
  var medicacaoRegistrada = medicacoes || ""; // Medicações selecionadas
  var observacoesConsulta = observacoes || ""; // Observações gerais da consulta

  // Se houver texto livre de medicação prescrita, adicione-o às observações
  if (medicacaoPrescritaTexto) {
    observacoesConsulta += (observacoesConsulta ? " | Prescrição: " : "Prescrição: ") + medicacaoPrescritaTexto;
  }
  // Se precisar de retorno, adicione essa informação nas observações também
  if (precisaRetorno && dataHoraRetornoFormatada) {
    observacoesConsulta += (observacoesConsulta ? " | Retorno Agendado: " : "Retorno Agendado: ") + dataHoraRetornoFormatada;
  }


  // ATENÇÃO: A ORDEM AQUI DEVE CORRESPONDER EXATAMENTE AOS CABEÇALHOS DA SUA ABA "Histórico Médico".
  // Suas colunas: ID do Animal, Data e Hora do Evento, Tipo de Evento, Medicação, Dose, Via de Administração, Responsável, Observações, Veterinário Responsável
  var novaLinha = [
    animalId,                       // 1. ID do Animal
    dataHoraConsultaFormatada,      // 2. Data e Hora do Evento
    'Consulta',                     // 3. Tipo de Evento
    medicacaoRegistrada,            // 4. Medicação (checkou)
    "",                             // 5. Dose (vazio para consulta, é para medicação individual)
    "",                             // 6. Via de Administração (vazio para consulta, é para medicação individual)
    Session.getActiveUser().getEmail(), // 7. Responsável (quem registrou no sistema)
    observacoesConsulta,            // 8. Observações (texto livre + prescrição + retorno)
    veterinario || ""               // 9. Veterinário Responsável (o selecionado no dropdown)
  ];
  
  abaHistorico.appendRow(novaLinha);

  SpreadsheetApp.getUi().alert('Sucesso', 'Consulta registrada para o animal com ID: ' + animalId, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Exibe o formulário para registro de medicação (simples).
 */
function solicitarIdParaMedicacao() {
  var ui = SpreadsheetApp.getUi();
  var resultadoId = ui.prompt(
      'Registrar Medicação',
      'Digite o ID do animal:',
      ui.ButtonSet.OK_CANCEL);
  if (resultadoId.getSelectedButton() == ui.Button.OK) {
    var idAnimal = resultadoId.getResponseText();
    if (idAnimal && verificarIdAnimalCadastrado(idAnimal)) {
      var listaMedicacoes = getListaMedicacoes();
      var htmlTemplate = HtmlService.createTemplateFromFile('FormularioMedicacao');
      htmlTemplate.listaMedicacoes = listaMedicacoes;
      htmlTemplate.animalId = idAnimal; 
      var htmlOutput = htmlTemplate.evaluate()
          .setWidth(300)
          .setHeight(250); // Ajustei a altura
      ui.showModalDialog(htmlOutput, 'Registrar Medicação');
    } else if (idAnimal) {
        ui.alert('Erro', 'O ID "' + idAnimal + '" não está cadastrado.', SpreadsheetApp.getUi().ButtonSet.OK);
    }
  }
}

/**
 * Registra uma medicação simples na aba de Histórico Médico.
 */
function registrarMedicacaoDoFormulario(animalId, medicacao, dose, via) { 
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaHistorico = ss.getSheetByName(ABA_HISTORICO);
  var dataHora = new Date();
  var responsavel = Session.getActiveUser().getEmail();
  
  var novaLinha = [
    animalId, 
    Utilities.formatDate(dataHora, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"), 
    "Medicação", 
    medicacao || "", 
    dose || "", 
    via || "", 
    responsavel, 
    "Medicação registrada via formulário simples.", // Observações
    "" // Veterinário Responsável (não aplicável para este registro simples)
  ];
  abaHistorico.appendRow(novaLinha);
  SpreadsheetApp.getUi().alert('Sucesso', 'Medicação "' + medicacao + '" registrada para o animal com ID: ' + animalId, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Registra a administração de medicação na aba de Histórico Médico.
 * Colunas: ID do Animal, Data e Hora do Evento, Tipo de Evento, Medicação, Dose, Via de Administração, Responsável, Observações, Veterinário Responsável
 */



/**
 * Exibe o formulário para administração de medicação (completo).
 */
function solicitarIdParaAdministrarMedicacao() {
  var ui = SpreadsheetApp.getUi();
  var resultadoId = ui.prompt(
      'Administrar Medicação',
      'Digite o ID do animal:',
      ui.ButtonSet.OK_CANCEL);
  if (resultadoId.getSelectedButton() == ui.Button.OK) {
    var idAnimal = resultadoId.getResponseText();
    if (idAnimal && verificarIdAnimalCadastrado(idAnimal)) {
      var listaMedicacoes = getListaMedicacoes();
      var htmlTemplate = HtmlService.createTemplateFromFile('FormularioAdministrarMedicacao');
      htmlTemplate.listaMedicacoes = listaMedicacoes;
      htmlTemplate.animalId = idAnimal;
      var htmlOutput = htmlTemplate.evaluate()
          .setWidth(400)
          .setHeight(400);
      ui.showModalDialog(htmlOutput, 'Administrar Medicação');
    } else if (idAnimal) {
        ui.alert('Erro', 'O ID "' + idAnimal + '" não está cadastrado.', SpreadsheetApp.getUi().ButtonSet.OK);
    }
  }
}

/**
 * Registra a administração de medicação na aba de Histórico Médico.
 */
function registrarAdministracaoMedicacao(animalId, dataHora, medicacao, dose, via, observacoes) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaHistorico = ss.getSheetByName(ABA_HISTORICO);
  var responsavel = Session.getActiveUser().getEmail();
  
  var novaLinha = [
    animalId, 
    Utilities.formatDate(new Date(dataHora), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"), 
    "Medicação (Admin)", 
    medicacao || "", 
    dose || "", 
    via || "", 
    responsavel, 
    observacoes || "",
    "" // Veterinário Responsável (não aplicável para este registro)
  ];
  abaHistorico.appendRow(novaLinha);
  SpreadsheetApp.getUi().alert('Sucesso', 'Medicação "' + medicacao + '" administrada para o animal com ID: ' + animalId + ' em ' + Utilities.formatDate(new Date(dataHora), Session.getTimeZone(), "dd/MM/yyyy HH:mm"), SpreadsheetApp.getUi().ButtonSet.OK);
}





// Funções de Internação/Alta (mantidas como estavam, mas revisadas para usar registrarEventoHistorico)
function solicitarIdParaInternacao() {
  var ui = SpreadsheetApp.getUi();
  var resultadoId = ui.prompt(
      'Registrar Internação',
      'Digite o ID do animal:',
      ui.ButtonSet.OK_CANCEL);
  if (resultadoId.getSelectedButton() == ui.Button.OK) {
    var idAnimal = resultadoId.getResponseText();
    if (idAnimal && verificarIdAnimalCadastrado(idAnimal)) {
      registrarEventoHistorico(idAnimal, "Internação", "", "", "", "Animal internado.");
    } else if (idAnimal) {
        ui.alert('Erro', 'O ID "' + idAnimal + '" não está cadastrado.', SpreadsheetApp.getUi().ButtonSet.OK);
    }
  }
}

function solicitarIdParaAlta() {
  var ui = SpreadsheetApp.getUi();
  var resultadoId = ui.prompt(
      'Registrar Alta',
      'Digite o ID do animal:',
      ui.ButtonSet.OK_CANCEL);
  if (resultadoId.getSelectedButton() == ui.Button.OK) {
    var idAnimal = resultadoId.getResponseText();
    if (idAnimal && verificarIdAnimalCadastrado(idAnimal)) {
      registrarEventoHistorico(idAnimal, "Alta", "", "", "", "Animal recebeu alta.");
    } else if (idAnimal) {
        ui.alert('Erro', 'O ID "' + idAnimal + '" não está cadastrado.', SpreadsheetApp.getUi().ButtonSet.OK);
    }
  }
}

/**
 * Registra um evento genérico no histórico do animal.
 * @param {string} idAnimal ID do animal.
 * @param {string} tipoEvento Tipo do evento (e.g., "Internação", "Alta", "Vacina").
 * @param {string} medicacao Medicação associada ao evento (opcional).
 * @param {string} dose Dose da medicação (opcional).
 * @param {string} via Via de administração (opcional).
 * @param {string} observacoes Observações adicionais.
 * @param {string} veterinario Responsável principal (opcional, para eventos que não sejam consulta principal)
 */
function registrarEventoHistorico(idAnimal, tipoEvento, medicacao, dose, via, observacoes, veterinario = "") {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaHistorico = ss.getSheetByName(ABA_HISTORICO);
  if (!abaHistorico) {
    SpreadsheetApp.getUi().alert('Erro', 'A aba "Histórico Médico" não foi encontrada.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  var dataHora = new Date();
  var responsavel = Session.getActiveUser().getEmail();

  var novaLinha = [
    idAnimal, 
    Utilities.formatDate(dataHora, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"), 
    tipoEvento, 
    medicacao || "", 
    dose || "", 
    via || "", 
    responsavel, 
    observacoes || "",
    veterinario || "" 
  ];
  abaHistorico.appendRow(novaLinha);
  SpreadsheetApp.getUi().alert('Sucesso', 'Evento "' + tipoEvento + '" registrado para o animal com ID: ' + idAnimal, SpreadsheetApp.getUi().ButtonSet.OK);
}



// REMOVIDA: função 'registrarConsulta()' duplicada e incompleta.
// REMOVIDA: funções 'solicitarIdParaAcao' e 'solicitarIdComAmbulatorio' - elas foram substituídas por chamadas diretas ou adaptadas.
// REMOVIDA: A função 'mostrarFormularioConsulta()' antiga, que usava alert para exibir. Agora é 'solicitarIdParaConsultaAnimalInfo()'.
// REMOVIDA: A função 'cadastrarNovoAnimal' duplicada e simplificada.
