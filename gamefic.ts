import 'dotenv/config';

import { FunctionTool, LlmAgent } from '@google/adk';
import { z } from 'zod';
import { enviarDadosDaAtualizacaoDeNome, enviarDadosDoRegistroDeLead } from './src/adapters/backend';
import { error } from './src/services/tools/error';
import { sendClienteToAgenteHuman } from './src/services/tools/sendClienteToAgenteHuman';

/* ======================================================
   TYPES
====================================================== */

type SessionContext = any;


/* ======================================================
   REGISTER LEAD TOOL
====================================================== */

export const registerLead = new FunctionTool({
  name: 'register_lead',
  description: 'Registra um lead B2B qualificado no sistema Gamefic',

  parameters: z.object({
    nome: z.string().min(2, 'Nome inválido'),
    email: z.string().email('Email inválido'),

    contexto: z.string().min(10, 'Contexto insuficiente'),

    problemaCentral: z.string().min(10, 'Problema mal definido'),

    objetivoLead: z.string().min(5, 'Objetivo fraco'),

    solucao: z.string().min(5, 'Solução não clara'),

    tomLead: z.enum([
      'curioso',
      'engajado',
      'analitico',
      'decisor',
      'cetico'
    ]),

    urgenciaLead: z.enum([
      'baixa',
      'media',
      'alta'
    ]),

    instrucao: z.string().min(10, 'Instrução incompleta'),
    localidade: z.string().optional()
  }),

  execute: async (params, toolContext: SessionContext) => {
    try {
      const {
        nome,
        email,
        contexto,
        problemaCentral,
        objetivoLead,
        solucao,
        tomLead,
        urgenciaLead,
        instrucao,
        localidade
      } = params;

      const session = toolContext?.invocationContext?.session;

      const telefoneLead = session?.id ?? null;

      /* ===============================
         LOG ESTRUTURADO
      =============================== */

      console.log('[NEW LEAD]', {
        nome,
        email,
        contexto,
        problemaCentral,
        objetivoLead,
        solucao,
        tomLead,
        urgenciaLead,
        instrucao,
        localidade
      });

      /* ===============================
         PAYLOAD
      =============================== */

      const dados = {
        nome,
        email,
        contexto,
        produto: contexto,
        nivelInteresse: solucao,
        problemaCentral,
        objetivoLead,
        tomLead,
        urgenciaLead,
        instrucao,
        localidade,

        telefone: telefoneLead,

        nomeAgente:
          process.env.NOME_AGENTE_VENDAS ?? 'Agente Gamefic',

        telefoneAgente:
          process.env.NUMBER_VENDAS ?? '5534997801829'
      };

      await sendClienteToAgenteHuman(dados);

      return {
        status: 'success',
        message:
          'Obrigado pelo contato. Seu atendimento será continuado por um especialista.'
      };

    } catch (err) {
      console.error('[REGISTER ERROR]', err);

      return {
        status: 'error',
        message:
          'Falha ao registrar lead. Tente novamente.'
      };
    }
  }
});


export const registerNameLead = new FunctionTool({
  name: 'register_name_lead',
  description: 'Registra o nome capturado do lead para o time comercial',

  parameters: z.object({
    nome: z.string().min(2, 'Nome inválido')
  }),

  execute: async (params, toolContext: SessionContext) => {
    try {
      const {
        nome
      } = params;

      const session = toolContext?.invocationContext?.session;

      const telefoneLead = session?.id ?? JSON.stringify(session);

      /* ===============================
         LOG ESTRUTURADO
      =============================== */

      console.log('[Atualizado nome do Lead]', {
        nome
      });

      /* ===============================
         PAYLOAD
      =============================== */

      const metaDados = {
        display_phone_number: "553491713923",
        phone_number_id: "872884792582393"
      }
      await enviarDadosDaAtualizacaoDeNome(telefoneLead, nome, metaDados);

      return {
        status: 'success',
        message:
          `Contato atualizado com sucesso. O nome do lead é ${nome}.`
      };

    } catch (err) {
      console.error('[REGISTER ERROR]', err);

      return {
        status: 'error',
        message:
          'Falha ao registrar nome do lead. Tente novamente.'
      };
    }
  }
});


export const errorLead = new FunctionTool({
  name: 'error_lead',
  description: 'Registra problemas técnicos do cliente',

  parameters: z.object({
    nome: z.string().min(2),

    problema: z.string().min(5),

    etapa: z.enum([
      'login',
      'plataforma',
      'pagamento',
      'acesso',
      'outro'
    ])
  }),

  execute: async (params, toolContext: SessionContext) => {
    try {
      const { nome, problema, etapa } = params;

      const session = toolContext?.invocationContext?.session

      const telefoneLead = session?.id ?? JSON.stringify(session);

      const dados = {
        nome,
        problema,
        etapa,
        telefone: telefoneLead,
        nomeAgente:
          process.env.NOME_AGENTE_SUPORTE ?? 'Suporte Cardoso',

        telefoneAgente:
          process.env.NUMBER_SUPORTE ?? '5534997801829'
      };

      const metaDados = {
        display_phone_number: "553491713923",
        phone_number_id: "872884792582393"
      }

      await enviarDadosDoRegistroDeLead(telefoneLead, nome, metaDados, problema);

      console.log('[SUPPORT]', dados);

      await error(dados);



      return {
        status: 'success',
        message:
          `Obrigado, ${nome}. Nosso suporte já recebeu sua solicitação.`
      };

    } catch (err) {
      console.error('[SUPPORT ERROR]', err);

      return {
        status: 'error',
        message:
          'Erro ao registrar suporte.'
      };
    }
  }
});


/* ======================================================
   ROOT AGENT
====================================================== */
const promptAtualteste = `
Você é Fic, uma agente inteligente de atendimento B2B da Gamefic.

OBJETIVO
Conduzir conversas curtas, estratégicas e consultivas para entender o contexto do cliente, avaliar aderência ao Gamefic, qualificar leads sem questionários e registrar leads ou chamados técnicos apenas quando apropriado.

ESTILO DE COMUNICAÇÃO
- Seja sempre educada, profissional e estratégica.
- Use respostas breves, claras e objetivas.
- Evite textos longos, jargões e informalidade excessiva.
- Adote postura consultiva e executiva.
- Adapte o tom ao estilo do cliente.
- Faça no máximo uma pergunta por resposta.

ESTRATÉGIA DE CONVERSA
- Não utilize questionários ou formulários.
- Inferir informações a partir da conversa sempre que possível.
- Priorize perguntas amplas e naturais.
- Valide entendimentos de forma curta.
- O agente deve interpretar e resumir o contexto do cliente internamente.

QUALIFICAÇÃO DE LEADS
- Utilize a ferramenta register_lead apenas quando todos os campos obrigatórios puderem ser inferidos ou confirmados.
- Caso falte apenas o e-mail, pergunte de forma direta e profissional no final da conversa.
- Nunca informe ao cliente que um lead está sendo registrado.

Campos obrigatórios para register_lead (inferir sempre que possível):
- nome
- email
- contexto (descrição do negócio e setor)
- problema central
- objetivoLead
- tomLead
- urgenciaLead
- instrucao (orientação clara para o time comercial)

SUPORTE TÉCNICO
- Se o cliente relatar problema técnico, utilize a ferramenta error_lead.
- Seja objetivo ao confirmar informações faltantes.
- Não misture suporte com venda.

Campos obrigatórios para error_lead:
- nome
- email
- nome da empresa
- localidade
- problema
- etapa (login, plataforma, pagamento, acesso ou outro)

REDIRECIONAMENTO DE ASSUNTO
- Tente redirecionar o cliente ao tema Gamefic até 3 vezes.
- Caso o cliente persista fora do contexto, registre com error_lead.
- Utilize a resposta padrão:
"Este canal é restrito a assuntos relacionados à Gamefic."

REGRAS FINAIS
- Nunca solicitar todos os dados explicitamente.
- Nunca usar respostas longas.
- Nunca pressionar o cliente.
- O agente deve sempre inferir, resumir e registrar de forma estratégica.
`

export const rootAgent = new LlmAgent({
  name: 'sales_agent_fluxy',

  model: 'gemini-2.5-flash',

  instruction: promptAtualteste,

  tools: [registerLead, registerNameLead, errorLead]
});

/* ======================================================
   START COMMANDS

   npx adk web
   npx adk api_server
====================================================== */


const promptAntigoGamefic = `
Você e uma agente inteligente de atendimentos da Gamefic 💙 que se chama Fic e você deve seguir algumas funções e regras de comunicação.

━━━━━━━━━━━━━━━━━━━━━━
REGRAS DE COMUNICAÇÃO
━━━━━━━━━━━━━━━━━━━━━━

- Seja sempre educada, profissional e estratégica com atendimento venda B2B mantendo uma conversa bem humanizada.
- Adapte seu tom ao estilo do cliente, mas sempre mantendo uma postura consultiva e executiva.
- Seja clara, objetiva e evite jargões ou informalidades excessivas.
- Evite pressão de vendas, persuasão genérica, verborragia excessiva e informalidade.
- Responda no mesmo idioma do cliente, se não for possível identificar, responda em português.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENTES COM INTERESSE EM GAMEFIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Se o cliente demonstrar interesse em Gamefic, conduza a conversa de forma estratégica para entender o contexto do cliente, o problema central que ele deseja resolver, o objetivo dele ao buscar uma solução como o Gamefic, o nível de urgência e o tom de comunicação dele.
- Registre um lead qualificado para o time comercial usando a ferramenta register_lead somente quando todos os dados obrigatórios estiverem claramente inferidos ou explicitamente declarados.
- Se algum dado obrigatório estiver faltando, continue a qualificação usando uma conversa estratégica de forma natural e fluida, sem parecer um questionário e sem usar formulários.

Campos obrigatórios para registro de lead:

- nome
- email
- contexto (O agent fic deve informar uma  descrição do negócio e setor de atuação)
- problema central (O agent fic deve informar uma descrição do que o cliente deseja resolver com o Gamefic)
- objetivoLead (o que o cliente espera alcançar com o Gamefic de acordo com oque ele mencinou)
- tomLead (O agente fic deve indentificar se o nosso lead esta curioso, engajado, analítico, decisor ou cético)
- urgenciaLead (O agente fic precisa indentificar qual a necessidade dessa demanda baixa, média ou alta)
- instrucao (O agente deve modelar uma instrução clara para o time comercial sobre como abordar o cliente)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENTES COM DUVIDAS E NECESSIDADES DE SUPORTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Se o cliente mencionar ou solicitar ajuda com algum problema técnico, registre o problema para o time de suporte usando a ferramenta error_lead.

Campos obrigatórios para registro de suporte:

- nome
- email
- nome da empresa
- localidade
- problema (descrição do problema técnico enfrentado)
- etapa (fase do processo onde o problema ocorreu: login, plataforma, pagamento, acesso ou outro)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENTES EM CASO DE EXTRAVIO DE TÓPICOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Se o cliente se desviar de tópicos relacionados a Gamefic após três tentativas de redirecionamento, execute a ferramenta error_lead para registrar o problema.
- Se o cliente insistir em tópicos não relacionados, responda educadamente: "Este canal é restrito a assuntos relacionados a Gamefic."
`

