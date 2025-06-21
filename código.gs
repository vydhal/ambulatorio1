const ABA_CADASTRO = "Cadastro de Animais"; // Confirme que o nome da sua aba é EXATAMENTE "Cadastro de Animais"
const ABA_HISTORICO = "Histórico Médico"; // Confirme este nome
const ABA_CONFIGURACOES = "Configurações"; // Confirme este nome
const ABA_ESPECIES = "Espécies"; // Confirme este nome
const ABA_MEDICACOES = "Medicamentos"; // Confirme este nome
const COLUNA_ID = 1; // Coluna do ID na aba de Cadastro (Coluna A)

// Variável global para armazenar o ID do animal (usado em outras partes do seu script)
let animalIdParaMedicacao; 

// --- FUNÇÕES DE SUPORTE (Confirmação e Correção) ---

/**
 * Retorna uma lista de nomes de espécies da aba "Espécies".
 * @return {string[]} Uma array de strings com os nomes das espécies.
 */
function getListaEspecies() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaEspecies = ss.getSheetByName(ABA_ESPECIES);
  if (!abaEspecies) {
    // Melhor usar Logger.log para erros não críticos e ui.alert apenas em interação direta com o usuário
    Logger.log('Erro: Aba "' + ABA_ESPECIES + '" não encontrada. Por favor, crie uma aba com este nome e liste as espécies nela, uma por linha na primeira coluna.');
    return [];
  }
  var ultimaLinha = abaEspecies.getLastRow();
  // Se a aba estiver vazia ou tiver apenas cabeçalho, retorna array vazio
  if (ultimaLinha > 1) { 
    return abaEspecies.getRange(2, 1, ultimaLinha - 1, 1).getValues().map(function(row) {
      return row[0];
    });
  }
  return [];
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
  var cpfsJaAdicionados = {}; // Para evitar CPFs duplicados na lista

  var cabecalho = dados[0];

  // IMPORTANTE: USE OS NOMES EXATOS DAS COLUNAS DA SUA PLANILHA AQUI
  var colTutorNome = cabecalho.indexOf("Nome do Tutor");
  var colTutorCpf = cabecalho.indexOf("cpf tutor"); // Nome da coluna conforme sua confirmação

  if (colTutorNome === -1 || colTutorCpf === -1) {
    Logger.log('Erro: Colunas "Nome do Tutor" ou "cpf tutor" não encontradas na aba "' + ABA_CADASTRO + '". Verifique os cabeçalhos.');
    return [];
  }

  // Começa do índice 1 para pular o cabeçalho
  for (var i = 1; i < dados.length; i++) {
    var tutorNome = dados[i][colTutorNome];
    var tutorCpf = dados[i][colTutorCpf];

    // Normaliza o CPF para remover pontos e traços, garantindo que não haja duplicação por formatação diferente
    var cpfNormalizado = tutorCpf ? String(tutorCpf).replace(/[^0-9]/g, '') : '';

    // Adiciona o tutor se o nome e CPF normalizado existirem e o CPF ainda não foi adicionado
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
  if (dados.length < 2) { // Se não há dados além do cabeçalho
    return null; 
  }

  var cabecalho = dados[0];

  // IMPORTANTE: USE OS NOMES EXATOS DAS COLUNAS DA SUA PLANILHA AQUI
  var colTutorNome = cabecalho.indexOf("Nome do Tutor");
  var colTutorTelefone = cabecalho.indexOf("Telefone do Tutor");
  var colTutorEmail = cabecalho.indexOf("Email do Tutor");
  var colTutorCpf = cabecalho.indexOf("cpf tutor"); // Nome da coluna conforme sua confirmação
  var colTutorEndereco = cabecalho.indexOf("ENDEREÇO"); // CORREÇÃO: "indexOf" em vez de "halteredIndexOf"

  if (colTutorNome === -1 || colTutorTelefone === -1 || colTutorEmail === -1 || colTutorCpf === -1 || colTutorEndereco === -1) {
    Logger.log('Erro: Uma ou mais colunas de tutor não foram encontradas na aba "' + ABA_CADASTRO + '". Verifique os cabeçalhos: "Nome do Tutor", "Telefone do Tutor", "Email do Tutor", "cpf tutor", "ENDEREÇO".');
    return null;
  }

  // Normaliza o CPF de busca
  var cpfNormalizadoBusca = cpf ? String(cpf).replace(/[^0-9]/g, '') : '';

  // Procura o tutor a partir da segunda linha (índice 1)
  for (var i = 1; i < dados.length; i++) { 
    var cpfPlanilha = dados[i][colTutorCpf];
    var cpfPlanilhaNormalizado = cpfPlanilha ? String(cpfPlanilha).replace(/[^0-9]/g, '') : '';

    if (cpfPlanilhaNormalizado === cpfNormalizadoBusca) {
      return {
        nome: dados[i][colTutorNome],
        telefone: dados[i][colTutorTelefone],
        email: dados[i][colTutorEmail],
        cpf: dados[i][colTutorCpf], // Retorna o CPF como está na planilha (com formatação, se houver)
        endereco: dados[i][colTutorEndereco]
      };
    }
  }
  return null; // Retorna null se o tutor não for encontrado
}


/**
 * Função para cadastrar um novo animal no Sheets.
 * Esta função é chamada pelo HTML.
 *
 * A ordem dos parâmetros aqui deve ser EXATAMENTE a mesma que o HTML está enviando.
 * A ordem dos elementos no array 'novaLinha' deve ser EXATAMENTE a mesma ordem das colunas na sua planilha.
 *
 * @param {string} nome Nome do animal.
 * @param {string} especie Espécie do animal.
 * @param {string} raca Raça do animal.
 * @param {string} sexo Sexo do animal.
 * @param {string} porte Porte do animal.
 * @param {string} pelagem Pelagem do animal.
 * @param {number} peso Peso do animal.
 * @param {string} tutorNome Nome do tutor.
 * @param {string} tutorTelefone Telefone do tutor.
 * @param {string} tutorEmail Email do tutor.
 * @param {string} tutorCpf CPF do tutor.
 * @param {string} observacoes Observações sobre o animal.
 * @param {string} tutorEndereco Endereço do tutor.
 * @param {string} idade Idade do animal (NOVO PARÂMETRO). //
 */


function cadastrarNovoAnimalDoFormulario(
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
  idade // NOVO PARÂMETRO //
) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaCadastro = ss.getSheetByName(ABA_CADASTRO);

  if (!abaCadastro) {
    Logger.log('Erro: A aba "' + ABA_CADASTRO + '" não foi encontrada.');
    SpreadsheetApp.getUi().alert('Erro Crítico', 'A aba de cadastro não foi encontrada. Contate o administrador.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  var id = gerarProximoId(); // Gera o próximo ID sequencial

  Logger.log("Dados recebidos para cadastro: " + JSON.stringify({
    id: id,
    nome: nome,
    especie: especie,
    raca: raca,
    sexo: sexo,
    porte: porte,
    pelagem: pelagem,
    peso: peso,
    tutorNome: tutorNome,
    tutorTelefone: tutorTelefone,
    tutorEmail: tutorEmail,
    tutorCpf: tutorCpf,
    observacoes: observacoes,
    tutorEndereco: tutorEndereco,
    idade: idade // NOVO CAMPO NO LOG //
  }));

  // ATENÇÃO: A ORDEM DOS ELEMENTOS NO ARRAY 'novaLinha' DEVE CORRESPONDER
  // EXATAMENTE À ORDEM DAS SUAS COLUNAS NA PLANILHA "Cadastro de Animais".
  // A lista de colunas confirmada:
  // ID, Nome, Espécie, Raça, Sexo, Porte, Pelagem, Peso, Nome do Tutor, Telefone do Tutor, Email do Tutor, cpf tutor, Observações, ENDEREÇO, Idade
  var novaLinha = [
    id,             // Coluna A
    nome,           // Coluna B
    especie,        // Coluna C
    raca,           // Coluna D
    sexo,           // Coluna E
    porte,          // Coluna F
    pelagem,        // Coluna G
    peso,           // Coluna H
    tutorNome,      // Coluna I
    tutorTelefone,  // Coluna J
    tutorEmail,     // Coluna K
    tutorCpf,       // Coluna L
    observacoes,    // Coluna M
    tutorEndereco,  // Coluna N
    idade           // Coluna O (NOVA COLUNA) //
  ];
  
  try {
    abaCadastro.appendRow(novaLinha);
    SpreadsheetApp.getUi().alert('Sucesso', 'Animal "' + nome + '" cadastrado com ID: ' + id, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    Logger.log('Erro ao cadastrar animal: ' + e.message);
    SpreadsheetApp.getUi().alert('Erro', 'Ocorreu um erro ao cadastrar o animal: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}












//adição de veterinários

function getListaVeterinarios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaConfiguracoes = ss.getSheetByName("Configurações"); // Assumindo que sua aba de configurações se chama "Configurações"
  if (!abaConfiguracoes) {
    SpreadsheetApp.getUi().alert('Erro', 'A aba "Configurações" não foi encontrada.', SpreadsheetApp.getUi().ButtonSet.OK);
    return [];
  }
  var colunaVeterinarios = abaConfiguracoes.getRange("D:D").getValues(); // Assumindo que a coluna D contém os veterinários
  var listaFiltrada = [];
  for (var i = 0; i < colunaVeterinarios.length; i++) {
    var veterinario = colunaVeterinarios[i][0];
    if (veterinario && listaFiltrada.indexOf(veterinario) === -1) { // Adiciona apenas valores não vazios e únicos
      listaFiltrada.push(veterinario);
    }
  }
  return listaFiltrada.sort(); // Opcional: ordenar a lista alfabeticamente
}

//demais funções do sistema

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
        var listaVeterinarios = getListaVeterinarios(); // Obtém a lista de veterinários
        var htmlTemplate = HtmlService.createTemplateFromFile('FormularioConsultaAmbulatorio1');
        htmlTemplate.listaMedicacoes = listaMedicacoes;
        htmlTemplate.listaVeterinarios = listaVeterinarios; // Passa a lista para o formulário
        var htmlOutput = htmlTemplate.evaluate()
            .setWidth(600)
            .setHeight(500);
        ui.showModalDialog(htmlOutput, 'Registrar Consulta');
        // Passar o ID do animal para o formulário (opcional, mas útil)
        htmlOutput.idAnimalConsulta = idAnimalConsulta;
      } else {
        ui.alert('Erro', 'O ID "' + idAnimalConsulta + '" não está cadastrado. Por favor, cadastre o animal primeiro.', SpreadsheetApp.getUi().ButtonSet.OK);
      }
    }
  }
}

function verificarIdAnimalCadastrado(idAnimal) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaCadastro = ss.getSheetByName(ABA_CADASTRO);
  var dataCadastro = abaCadastro.getDataRange().getValues();
  for (var i = 1; i < dataCadastro.length; i++) {
    if (dataCadastro[i][COLUNA_ID - 1] == idAnimal) {
      return true; // ID encontrado
    }
  }
  return false; // ID não encontrado
}

function registrarConsultaAmbulatorio1(animalId, dataHoraConsulta, observacoes, precisaRetorno, dataHoraRetorno, medicacoes, medicacaoPrescritaTexto, veterinario) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaHistorico = ss.getSheetByName(ABA_HISTORICO);
  if (!abaHistorico) {
    SpreadsheetApp.getUi().alert('Erro', 'A aba "Histórico Médico" não foi encontrada.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  var novaLinha = [animalId, dataHoraConsulta, 'Consulta', medicacoes, medicacaoPrescritaTexto, veterinario, observacoes, precisaRetorno ? dataHoraRetorno : null]; // Ajuste a ordem e inclua todos os campos
  abaHistorico.appendRow(novaLinha);

  SpreadsheetApp.getUi().alert('Consulta registrada com sucesso!', '', SpreadsheetApp.getUi().ButtonSet.OK);
}

function onOpen() {
  Logger.log("Função onOpen() sendo executada."); // Adicione esta linha
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Gestão Clínica')
      .addItem('Cadastrar Novo Animal', 'mostrarFormularioCadastro')
      .addItem('Consultar Animal', 'mostrarFormularioConsulta')
      .addItem('Registrar Consulta', 'mostrarFormularioConsultaAmbulatorio1')
      .addItem('Atualizar Dashboard', 'atualizarDashboard')
      .addToUi();
}

function getListaMedicacoes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaConfiguracoes = ss.getSheetByName(ABA_CONFIGURACOES);
  if (abaConfiguracoes) {
    var colunaMedicacoes = abaConfiguracoes.getRange("A:A").getValues().flat().filter(String);
    colunaMedicacoes.shift(); // Remove o cabeçalho, se houver
    return colunaMedicacoes;
  }
  return [];
}

function gerarProximoId() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaCadastro = ss.getSheetByName(ABA_CADASTRO);
  var ids = abaCadastro.getRange(2, COLUNA_ID, abaCadastro.getLastRow() - 1).getValues().flat().filter(String); // Pega todos os IDs existentes

  if (ids.length === 0) {
    return "001";
  }

  var ultimoIdStr = ids[ids.length - 1];
  var ultimoIdNum = parseInt(ultimoIdStr, 10);

  if (isNaN(ultimoIdNum)) {
    // Se o último ID não for um número, começamos do 1
    return "001";
  }

  var proximoIdNum = ultimoIdNum + 1;
  return proximoIdNum.toString().padStart(3, '0'); // Formata para 3 dígitos com zeros à esquerda
}

function mostrarFormularioCadastro() {
  var ui = SpreadsheetApp.getUi();
  var listaEspecies = getListaEspecies();
  var htmlTemplate = HtmlService.createTemplateFromFile('FormularioCadastroAnimal');
  htmlTemplate.listaEspecies = listaEspecies;
  var htmlOutput = htmlTemplate.evaluate()
      .setWidth(600)
      .setHeight(500);
  ui.showModalDialog(htmlOutput, 'Cadastrar Novo Animal');
}



function cadastrarNovoAnimal(nome) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaCadastro = ss.getSheetByName(ABA_CADASTRO);
  var id = gerarProximoId(); // Gera o próximo ID sequencial
  var novaLinha = [id, nome, "", "", "", "", "", "", "", "", "", ""]; // Preenche com dados básicos
  abaCadastro.appendRow(novaLinha);
  SpreadsheetApp.getUi().alert('Animal "' + nome + '" cadastrado com ID: ' + id);
}

function getListaEspecies() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaConfiguracoes = ss.getSheetByName("Configurações"); // Assumindo que sua aba de configurações se chama "Configurações"
  if (!abaConfiguracoes) {
    SpreadsheetApp.getUi().alert('Erro', 'A aba "Configurações" não foi encontrada.', SpreadsheetApp.getUi().ButtonSet.OK);
    return [];
  }
  var colunaEspecies = abaConfiguracoes.getRange("C:C").getValues(); // Lê todos os valores da coluna C
  var listaFiltrada = [];
  for (var i = 0; i < colunaEspecies.length; i++) {
    var especie = colunaEspecies[i][0];
    if (especie && listaFiltrada.indexOf(especie) === -1) { // Adiciona apenas valores não vazios e únicos
      listaFiltrada.push(especie);
    }
  }
  return listaFiltrada.sort(); // Opcional: ordenar a lista alfabeticamente
}

function mostrarFormularioConsulta() { // Modifique a função que chama a consulta
  var ui = SpreadsheetApp.getUi();
  var resultado = ui.prompt(
      'Consultar Animal',
      'Digite o ID do animal ou CPF do tutor:',
      ui.ButtonSet.OK_CANCEL);

  if (resultado.getSelectedButton() == ui.Button.OK) {
    var idOuCpf = resultado.getResponseText();
    if (idOuCpf) {
      consultarAnimal(idOuCpf);
    }
  }
}

function consultarAnimal(idOuCpf) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaCadastro = ss.getSheetByName(ABA_CADASTRO);
  var abaHistorico = ss.getSheetByName(ABA_HISTORICO);

  if (!abaCadastro) {
    SpreadsheetApp.getUi().alert('Erro', 'A aba "' + ABA_CADASTRO + '" não foi encontrada.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  if (!abaHistorico) {
    SpreadsheetApp.getUi().alert('Erro', 'A aba "' + ABA_HISTORICO + '" não foi encontrada.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  var dataCadastro = abaCadastro.getDataRange().getValues();
  var animalEncontrado = null;
  var linhaCadastro = -1;

  // Se não há dados além do cabeçalho, não há animais
  if (dataCadastro.length < 2) {
    SpreadsheetApp.getUi().alert('Erro', 'Nenhum animal cadastrado na aba "' + ABA_CADASTRO + '".', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // Tenta encontrar o animal pelo ID
  // COLUNA_ID é 1, então o índice do array é COLUNA_ID - 1 (0)
  for (var i = 1; i < dataCadastro.length; i++) {
    if (dataCadastro[i][COLUNA_ID - 1] == idOuCpf) {
      animalEncontrado = dataCadastro[i];
      linhaCadastro = i + 1;
      break;
    }
  }

  // Se não encontrou pelo ID, tenta pelo CPF (coluna 12 / índice 11, conforme sua confirmação)
  if (!animalEncontrado) {
    var colCpfTutor = dataCadastro[0].indexOf("cpf tutor"); // Busca o índice do CPF no cabeçalho
    if (colCpfTutor !== -1) {
        for (var i = 1; i < dataCadastro.length; i++) {
            // Normaliza o CPF da planilha e de busca para comparação
            var cpfPlanilha = String(dataCadastro[i][colCpfTutor] || '').replace(/[^0-9]/g, '');
            var cpfBusca = String(idOuCpf || '').replace(/[^0-9]/g, '');

            if (cpfPlanilha === cpfBusca) {
                animalEncontrado = dataCadastro[i];
                linhaCadastro = i + 1;
                // Importante: em vez de 'break', continue para encontrar todos os animais do mesmo CPF se houver
                // OU, se você espera apenas um animal por CPF, mantenha o break.
                // Para simplificar a exibição inicial, vamos pegar o primeiro encontrado e depois revisar.
                break; // Se encontrou o primeiro animal com esse CPF, pega ele
            }
        }
    } else {
        Logger.log("Aviso: Coluna 'cpf tutor' não encontrada na aba " + ABA_CADASTRO + ". A busca por CPF pode não funcionar.");
    }
  }

  if (animalEncontrado) {
    Logger.log("Animal encontrado no .gs: " + JSON.stringify(animalEncontrado));

    var mensagem = "--- Ficha do Animal ---\n";
    var cabecalhoCadastro = abaCadastro.getRange(1, 1, 1, abaCadastro.getLastColumn()).getValues()[0];
    Logger.log("Cabeçalho do Cadastro: " + JSON.stringify(cabecalhoCadastro));
    Logger.log("Comprimento do Cabeçalho: " + cabecalhoCadastro.length);
    Logger.log("Comprimento da linha do animal: " + animalEncontrado.length);


    // Itera apenas até o menor comprimento entre o cabeçalho e a linha de dados do animal
    // Isso evita o erro de "undefined" se a linha do animal tiver menos colunas
    var numColunasParaExibir = Math.min(cabecalhoCadastro.length, animalEncontrado.length);

    for (var j = 0; j < numColunasParaExibir; j++) {
      var valorCampo = animalEncontrado[j];
      // Tratamento para valores undefined ou nulos para que não apareçam como 'null' ou 'undefined' na mensagem
      if (valorCampo === undefined || valorCampo === null || String(valorCampo).trim() === '') {
        valorCampo = "[Não informado]"; 
      }
      mensagem += cabecalhoCadastro[j] + ": " + valorCampo + "\n";
    }

    mensagem += "\n--- Histórico de Consultas ---\n";
    var cabecalhoHistorico = abaHistorico.getRange(1, 1, 1, abaHistorico.getLastColumn()).getValues()[0];
    var dataHistorico = abaHistorico.getDataRange().getValues();
    var consultasAnimal = [];

    // Busca o ID do animal no histórico (assumindo que é a primeira coluna, índice 0)
    var colIdHistorico = 0; 
    var colTipoEventoHistorico = 2; // Assumindo que a coluna 3 (índice 2) é o Tipo de Evento

    for (var k = 1; k < dataHistorico.length; k++) {
      // Compara o ID do histórico (coluna 0) com o ID do animal encontrado (coluna 0)
      if (dataHistorico[k][colIdHistorico] == animalEncontrado[COLUNA_ID - 1] && 
          dataHistorico[k][colTipoEventoHistorico] === 'Consulta') {
        
        var consulta = "";
        // Itera até o menor comprimento entre o cabeçalho do histórico e a linha de dados do histórico
        var numColunasHistorico = Math.min(cabecalhoHistorico.length, dataHistorico[k].length);

        for (var l = 0; l < numColunasHistorico; l++) {
          var valorHistorico = dataHistorico[k][l];
          if (valorHistorico === undefined || valorHistorico === null || String(valorHistorico).trim() === '') {
             valorHistorico = "[Não informado]";
          }
          consulta += cabecalhoHistorico[l] + ": " + valorHistorico + " | ";
        }
        consultasAnimal.push(consulta);
      }
    }

    if (consultasAnimal.length > 0) {
      mensagem += consultasAnimal.join("\n");
    } else {
      mensagem += "Nenhuma consulta registrada para este animal.\n";
    }

    SpreadsheetApp.getUi().alert('Informações do Animal (ID: ' + animalEncontrado[COLUNA_ID - 1] + ')', mensagem, SpreadsheetApp.getUi().ButtonSet.OK);

  } else {
    SpreadsheetApp.getUi().alert('Erro', 'Animal com ID ou CPF "' + idOuCpf + '" não encontrado.', SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function solicitarIdParaMedicacao() {
  var ui = SpreadsheetApp.getUi();
  var resultadoId = ui.prompt(
      'Registrar Medicação',
      'Digite o ID do animal:',
      ui.ButtonSet.OK_CANCEL);
  if (resultadoId.getSelectedButton() == ui.Button.OK) {
    animalIdParaMedicacao = resultadoId.getResponseText();
    if (animalIdParaMedicacao) {
      mostrarDialogoMedicacao(animalIdParaMedicacao); // Passa o ID para a função do diálogo
    }
  }
}

function mostrarDialogoMedicacao(animalId) {
  var ui = SpreadsheetApp.getUi();
  var listaMedicacoes = getListaMedicacoes();
  var htmlTemplate = HtmlService.createTemplateFromFile('FormularioMedicacao');
  htmlTemplate.listaMedicacoes = listaMedicacoes;
  htmlTemplate.animalId = animalId; // Passa o ID para o template
  var htmlOutput = htmlTemplate.evaluate()
      .setWidth(300)
      .setHeight(200);
  ui.showModalDialog(htmlOutput, 'Registrar Medicação');
}

function registrarMedicacaoDoFormulario(animalId, medicacao, dose, via) { // Recebe o animalId corretamente
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaHistorico = ss.getSheetByName(ABA_HISTORICO);
  var dataHora = new Date();
  var responsavel = Session.getActiveUser().getEmail();
  var novaLinha = [animalId, dataHora, "Medicação", medicacao, dose, via, responsavel, ""];
  abaHistorico.appendRow(novaLinha);
  SpreadsheetApp.getUi().alert('Medicação "' + medicacao + '" registrada para o animal com ID: ' + animalId);
}

function registrarInternacao(idAnimal, ambulatorio) {
  registrarEventoHistorico(idAnimal, "Internação", "", "", "", "Ambulatório: " + ambulatorio);
}

function registrarAlta(idAnimal, ambulatorio) {
  registrarEventoHistorico(idAnimal, "Alta", "", "", "", "Ambulatório: " + ambulatorio);
}

function registrarConsulta() {
  var animalId = document.getElementById('animalId').value;
  var dataHoraConsulta = document.getElementById('dataHoraConsulta').value;
  var observacoes = document.getElementById('observacoes').value;
  var precisaRetorno = document.getElementById('precisaRetorno').checked;
  var dataHoraRetorno = document.getElementById('dataHoraRetorno').value;
  var medicacaoPrescritaDropdown = document.getElementById('medicacaoPrescritaTexto, veterinario');
}

function registrarEventoHistorico(idAnimal, tipoEvento, medicacao, dose, via, observacoes) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaHistorico = ss.getSheetByName(ABA_HISTORICO);
  var dataHora = new Date();
  var responsavel = Session.getActiveUser().getEmail();
  var novaLinha = [idAnimal, dataHora, tipoEvento, medicacao || "", dose || "", via || "", responsavel, observacoes || ""];
  abaHistorico.appendRow(novaLinha);
  SpreadsheetApp.getUi().alert('Evento "' + tipoEvento + '" registrado para o animal com ID: ' + idAnimal);
}

function onOpen() {
  Logger.log("Função onOpen() sendo executada."); // Adicione esta linha
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Gestão Clínica')
      .addItem('Cadastrar Novo Animal', 'mostrarFormularioCadastro')
      .addItem('Consultar Animal', 'mostrarFormularioConsulta') // Esta função deve ser a consultarAnimal() do Ambulatório 1
      .addItem('Registrar Consulta', 'mostrarFormularioConsultaAmbulatorio1')
      // Remova ou adapte outras opções do menu
      .addToUi();
}

function solicitarIdParaAdministrarMedicacao() {
  var ui = SpreadsheetApp.getUi();
  var resultadoId = ui.prompt(
      'Administrar Medicação',
      'Digite o ID do animal:',
      ui.ButtonSet.OK_CANCEL);
  if (resultadoId.getSelectedButton() == ui.Button.OK) {
    animalIdParaAdministrarMedicacao = resultadoId.getResponseText();
    if (animalIdParaAdministrarMedicacao) {
      mostrarFormularioAdministrarMedicacao(animalIdParaAdministrarMedicacao);
    }
  }
}

function mostrarFormularioAdministrarMedicacao(animalId) {
  var ui = SpreadsheetApp.getUi();
  var listaMedicacoes = getListaMedicacoes();
  var htmlTemplate = HtmlService.createTemplateFromFile('FormularioAdministrarMedicacao');
  htmlTemplate.listaMedicacoes = listaMedicacoes;
  htmlTemplate.animalId = animalId;
  var htmlOutput = htmlTemplate.evaluate()
      .setWidth(400)
      .setHeight(400);
  ui.showModalDialog(htmlOutput, 'Administrar Medicação');
}

function registrarAdministracaoMedicacao(animalId, dataHora, medicacao, dose, via, observacoes) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaHistorico = ss.getSheetByName(ABA_HISTORICO);
  var responsavel = Session.getActiveUser().getEmail();
  var novaLinha = [animalId, dataHora, "Medicação (Admin)", medicacao, dose, via, responsavel, observacoes || ""];
  abaHistorico.appendRow(novaLinha);
  SpreadsheetApp.getUi().alert('Medicação "' + medicacao + '" administrada para o animal com ID: ' + animalId + ' em ' + Utilities.formatDate(new Date(dataHora), Session.getTimeZone(), "dd/MM/yyyy HH:mm"));
}

function solicitarIdParaInternacao() {
  solicitarIdComAmbulatorio('Registrar Internação', 'registrarInternacao');
}

function solicitarIdParaAlta() {
  solicitarIdComAmbulatorio('Registrar Alta', 'registrarAlta');
}

function solicitarIdParaConsulta() {
  var ui = SpreadsheetApp.getUi();
  var htmlOutput = HtmlService.createHtmlOutputFromFile('FormularioConsulta')
      .setWidth(400) // Ajuste a largura conforme necessário
      .setHeight(350); // Ajuste a altura conforme necessário
  ui.showModalDialog(htmlOutput, 'Registrar Consulta');
}

function registrarConsultaDoFormulario(animalId, ambulatorio, observacoes) {
  registrarEventoHistorico(animalId, "Consulta", "", "", "", "Ambulatório: " + ambulatorio + (observacoes ? " | " + observacoes : ""));
  SpreadsheetApp.getUi().alert('Consulta registrada para o animal com ID: ' + animalId);
}

function solicitarIdParaAcao(titulo, funcao) {
  var ui = SpreadsheetApp.getUi();
  var resultado = ui.prompt(
      titulo,
      'Digite o ID do animal:',
      ui.ButtonSet.OK_CANCEL);
  if (resultado.getSelectedButton() == ui.Button.OK) {
    var idAnimal = resultado.getResponseText();
    if (idAnimal) {
      this[funcao](idAnimal); // Chama a função dinamicamente pelo nome
    }
  }
}

function solicitarIdComAmbulatorio(titulo, funcao) {
  var ui = SpreadsheetApp.getUi();
  var resultadoId = ui.prompt(
      titulo,
      'Digite o ID do animal:',
      ui.ButtonSet.OK_CANCEL);
  if (resultadoId.getSelectedButton() == ui.Button.OK) {
    var idAnimal = resultadoId.getResponseText();
    if (idAnimal) {
      var resultadoAmbulatorio = ui.prompt(
          titulo,
          'Selecione o ambulatório (1 ou 2):',
          ui.ButtonSet.OK_CANCEL);
      if (resultadoAmbulatorio.getSelectedButton() == ui.Button.OK) {
        var ambulatorio = resultadoAmbulatorio.getResponseText();
        if (ambulatorio === '1' || ambulatorio === '2') {
          this[funcao](idAnimal, ambulatorio);
        } else if (ambulatorio) {
          ui.alert('Aviso', 'Ambulatório inválido. Digite 1 ou 2.', ui.ButtonSet.OK);
        } else {
          this[funcao](idAnimal, ""); // Sem ambulatório
        }
      }
    }
  }
}
