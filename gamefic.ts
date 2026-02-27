import 'dotenv/config';

import { FunctionTool, LlmAgent } from '@google/adk';
import { z } from 'zod';
import { enviarDadosDaAtualizacaoDeNome, enviarDadosDoRegistroDeLead } from './src/adapters/backend';
import { promptRootGamefic, promptSalesAgentGamefic, promptSupportAgentGamefic } from './prompt';
import { error } from './src/services/tools/error';
import { sendClienteToAgenteHuman } from './src/services/tools/sendClienteToAgenteHuman';
import { getContact } from '@/services/tools/getContacto';

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



    empresa: z.string().min(5, 'Empresa não clara'),

    dataEHorario: z.string().min(5, 'Necessario uma data e horario para que possamos entrar em contato'),

    tomLead: z.enum([
      'curioso',
      'engajado',
      'analitico',
      'decisor',
      'cetico'
    ])
  }),

  execute: async (params, toolContext: SessionContext) => {
    try {
      const {
        nome,
        email,
        contexto,
        tomLead,
        dataEHorario
      } = params;

      const session = toolContext?.invocationContext?.session;

      const telefoneLead = session?.id ?? JSON.stringify(session);

      /* ===============================
         LOG ESTRUTURADO
      =============================== */

      console.log('[NEW LEAD]', {
        nome,
        email,
        contexto,
        tomLead,
        dataEHorario
      });

      /* ===============================
         PAYLOAD
      =============================== */

      const dados = {
        nome,
        email,
        contexto,
        produto: contexto,
        tomLead,
        dataEHorario,
        
        telefone: telefoneLead,

        nomeAgente:
          process.env.NOME_AGENTE_VENDAS ?? 'Agente Gamefic',

        telefoneAgente:
          process.env.NUMBER_VENDAS ?? '5534997801829'
      };

      const resultadoDoProcesso = await sendClienteToAgenteHuman(dados);

      console.log(`RESULTADO DO PROCESSO: ${resultadoDoProcesso}`)

      return {
        status: 'success',
        message:
          'Obrigado pelo contato. Seu atendimento será continuado por um especialista que entrara em contato o mais rapido possivel.'
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
        display_phone_number: "553491746481",
        phone_number_id: "1021940604341981"
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


export const getDetailsContact = new FunctionTool({
  name: 'pegar_detalhes_de_cliente',
  description: 'Coletar os dados de um cliente',


  execute: async (toolContext: SessionContext) => {
    try {

      const session = toolContext?.invocationContext?.session;

      const telefoneLead = session?.id ?? JSON.stringify(session);

      const metaDados = {
        display_phone_number: "553491746481",
        phone_number_id: "1021940604341981"
      }
      const resultado = await getContact(telefoneLead);

      return {
        status: 'success',
        message: 'Dados do contato',
        contato: resultado
      };

    } catch (err) {
      console.error('[REGISTER ERROR]', err);

      return {
        status: 'error',
        message: 'Falha ao consultar contato então e necessario coletar os dados menos o telefone.',
        contato: {
          phone: "",
          name: "",
          email: "",
          empresa: ""
        }
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
        display_phone_number: "553491746481",
        phone_number_id: "1021940604341981"
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


export const salesAgent = new LlmAgent({
  name: 'vendas_gamefic',
  model: 'gemini-2.5-flash',
  instruction: promptSalesAgentGamefic,
  tools: [registerLead, registerNameLead]
});


export const supportAgent = new LlmAgent({
  name: 'suporte_gamefic',
  model: 'gemini-2.5-flash',
  instruction: promptSupportAgentGamefic,
  tools: [errorLead, registerNameLead]
});


export const rootAgent = new LlmAgent({
  name: 'sales_agent_fluxy',
  model: 'gemini-2.5-flash',
  instruction: promptRootGamefic,
  subAgents: [salesAgent, supportAgent],
  tools: [getDetailsContact]
});

/* ======================================================
   START COMMANDS

   npx adk web
   npx adk api_server
====================================================== */