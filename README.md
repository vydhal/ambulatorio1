Título do Projeto
# Sistema de Gestão Clínica Veterinária (Google Sheets + Apps Script)

Descrição do Projeto
Uma breve introdução sobre o que o projeto faz.
Este projeto é um sistema de gestão clínica veterinária desenvolvido utilizando Google Sheets como base de dados e Google Apps Script para a lógica de backend e interface de usuário (HTML/CSS/JavaScript). O objetivo é otimizar o registro e consulta de informações de animais e seus históricos médicos.

Funcionalidades Atuais
Liste as principais funcionalidades que o sistema já oferece, com links para os arquivos HTML relevantes, se aplicável.

## Funcionalidades Atuais

**Cadastro de Animais:** Permite registrar novos animais com informações detalhadas (nome, espécie, raça, sexo, porte, pelagem, peso) e dados do tutor (nome, telefone, email, CPF, endereço). Oferece a opção de vincular a um tutor existente. [FormularioCadastroAnimal.html]
**Consulta de Informações do Animal:** Exibe um modal com a ficha completa do animal e seu histórico médico (consultas, medicações, eventos) de forma organizada em grid e tabelas. Permite buscar por ID do animal ou CPF do tutor. As datas no histórico são formatadas para DD/MM/YYYY HH:MM. [AnimalInfoDialog.html]
**Registro de Consulta (Ambulatório 1):** Formulário detalhado para registrar consultas específicas do Ambulatório 1, incluindo data/hora, observações, necessidade de retorno, veterinário responsável e lista de medicações pré-definidas (checkboxes) e texto livre para prescrição. [FormularioConsultaAmbulatorio1.html]
**Registro de Medicação (Simples):** Formulário para registrar rapidamente a medicação, dose e via de administração. [FormularioMedicacao.html]
**Administração de Medicação (Completo):** Formulário detalhado para registrar a administração de uma medicação com data/hora, dose, via e observações. [FormularioAdministrarMedicacao.html]
**Gerenciamento de Eventos (Internação/Alta):** Funções para registrar eventos de internação e alta de animais no histórico.
**Menus Customizados no Google Sheets:** Integração com um menu 'Gestão Clínica' na interface do Google Sheets para acesso rápido às funcionalidades.
**Exportação para Imagem:** A tela de informações do animal (AnimalInfoDialog.html) permite salvar seu conteúdo como imagem PNG para impressão ou arquivamento.
Estrutura das Planilhas (Google Sheets)
Descreva as abas e suas colunas esperadas.

## Estrutura das Planilhas (Google Sheets)

O sistema depende das seguintes abas e estruturas de coluna:

**1. Cadastro de Animais**
Colunas: ID, Nome, Espécie, Raça, Sexo, Porte, Pelagem, Peso, Nome do Tutor, Telefone do Tutor, Email do Tutor, cpf tutor, Observações, ENDEREÇO, (Opcional: Idade)
**2. Histórico Médico**
Colunas: ID do Animal, Data e Hora do Evento, Tipo de Evento, Medicação, Dose, Via de Administração, Responsável, Observações, Veterinário Responsável
**3. Configurações**
Coluna A: Medicamentos (lista de nomes de medicações)
Coluna C: Espécies (lista de espécies de animais)
Coluna D: Veterinários (lista de nomes de veterinários responsáveis)
Como Utilizar/Configurar
Instruções básicas para quem for configurar ou usar o projeto.

## Como Utilizar/Configurar

**Crie uma nova planilha no Google Sheets.**
**Crie as abas necessárias:** "Cadastro de Animais", "Histórico Médico", "Configurações", "Espécies", "Medicamentos". (Conforme a Estrutura das Planilhas acima).
**Preencha os cabeçalhos** das abas "Cadastro de Animais" e "Histórico Médico" EXATAMENTE como listado na seção "Estrutura das Planilhas".
**Preencha as listas nas abas "Configurações", "Espécies" e "Medicamentos"** conforme a descrição.
**Abra o Editor de Script:** Na sua planilha, vá emExtensões > Apps Script.
**Cole o código:**
Crie um novo arquivo.gs(se não houver um padrão) e cole todo o conteúdo do seucodigo.gsnele.
Crie arquivos HTML (.html) para cada formulário (ex:FormularioCadastroAnimal.html,AnimalInfoDialog.html, etc.) e cole o conteúdo correspondente.
**Salve o projeto do Apps Script.**
**Atualize o menu:** Recarregue a planilha (feche e abra o navegador) para que o menu "Gestão Clínica" apareça na barra superior.
**Conceda as permissões necessárias** ao executar o script pela primeira vez.
Próximos Passos e Ajustes Pendentes
Esta é a seção crucial para você! Use-a para documentar o que foi discutido e o que ainda precisa de decisão ou implementação.

## Próximos Passos e Ajustes Pendentes

**Decisão sobre Dosagem na Consulta:** Aprimorar o formulário "Registrar Consulta Ambulatório 1" para incluir campos de "Dose" e "Via de Administração" para as medicações selecionadas, ou manter a separação de responsabilidades com o formulário "Administrar Medicação". A decisão será tomada em conjunto com os veterinários.
**Revisão do Campo "Idade" no Cadastro de Animais:** Confirmar se o campo "Idade" será incluído e como será preenchido/calculado, e ajustar oFormularioCadastroAnimal.htmlecadastrarNovoAnimalDoFormularionocodigo.gsde acordo.
**Melhorias na UX/UI:** (Ex: Validação de campos no frontend, mensagens de erro mais amigáveis, etc.)
**Novas Funcionalidades:** (Ex: Agendamento, relatórios, etc.)
