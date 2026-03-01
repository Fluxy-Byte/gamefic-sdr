import 'dotenv/config';

import { FunctionTool, LlmAgent } from '@google/adk';
import { z } from 'zod';
import { enviarDadosDaAtualizacaoDeNome, enviarDadosDoRegistroDeLead } from './src/adapters/backend';
import { promptRootGamefic, promptSalesAgentGamefic, promptSupportAgentGamefic } from './prompt';
import { createProblemToContact } from './src/services/handleProblems';
import { createMeetToContact } from './src/services/handleMeet';
import { getContact, updateContact, updateNameContact } from './src/services/contact';
import { sendNotificationSquadSales } from './src/services/sendNotificationSquadSales';

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
    name: z.string().min(2, 'Nome inválido'),
    email: z.string().email('Email inválido'),
    empresa: z.string().min(5, 'Empresa não clara'),
    contexto_da_reuniao: z.string().min(10, 'Contexto insuficiente sobre oque o gliente que contratar a solução'),
    data_reuniao: z.string().min(5, 'Data da reunião inválida'),
  }),

  execute: async (params, toolContext: SessionContext) => {
    try {
      const {
        name,
        email,
        empresa,
        data_reuniao,
        contexto_da_reuniao
      } = params;

      const session = toolContext?.invocationContext?.session;

      const telefoneLead = session?.id ?? JSON.stringify(session);

      /* ===============================
         LOG ESTRUTURADO
      =============================== */

      console.log('[NEW LEAD]', {
        name,
        email,
        empresa,
        data_reuniao,
        contexto_da_reuniao,
        telefoneLead
      });

      /* ===============================
         PAYLOAD
      =============================== */

      const dadosLead = {
        email: email,
        name: name,
        phone: telefoneLead,
        empresa: empresa,
        dadosReunia: {
          data_reuniao: data_reuniao,
          contexto_da_reuniao: contexto_da_reuniao
        }
      }

      Promise.all([
        await updateContact(dadosLead),
        await createMeetToContact(dadosLead),
        await sendNotificationSquadSales("chegou_mais_um_lead", telefoneLead, "1021940604341981")
      ])

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
    nome: z.string().min(3, 'Nome inválido')
  }),

  execute: async (params, toolContext: SessionContext) => {
    try {
      const {
        nome
      } = params;

      const session = toolContext?.invocationContext?.session;

      const telefoneLead = session?.id ?? JSON.stringify(session);

      console.log('[Atualizado nome do Lead]', {
        nome
      });

      await updateNameContact(telefoneLead, nome);

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

      const resultado = await getContact(telefoneLead);

      return {
        status: 'success',
        message: 'Dados do contato para utilização de contexto',
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
    name: z.string().min(2, 'Nome inválido'),
    email: z.string().email('Email inválido'),
    empresa: z.string().min(5, 'Empresa não clara'),
    contexto_da_conversa: z.string().min(10, 'Contexto insuficiente sobre oque o gliente que contratar a solução'),
    data_do_problema: z.string().min(5, 'Data da reunião inválida'),
    local_do_problema: z.string().min(5, 'Local do problema não claro')
  }),


  execute: async (params, toolContext: SessionContext) => {
    try {
      const { name, email, empresa, contexto_da_conversa, data_do_problema, local_do_problema } = params;

      const session = toolContext?.invocationContext?.session

      const telefoneLead = session?.id ?? JSON.stringify(session);

      const dadosLead = {
        email: email,
        name: name,
        phone: telefoneLead,
        empresa: empresa,
        problemasContato: {
          data_do_problema: data_do_problema,
          local_do_problema: local_do_problema,
          contexto_da_conversa: contexto_da_conversa
        }
      }

      await updateContact(dadosLead)
      await createProblemToContact(dadosLead)
      await sendNotificationSquadSales("chegou_mais_um_lead", telefoneLead, "1021940604341981")

      return {
        status: 'success',
        message:
          `Obrigado, ${name}. Nosso suporte já recebeu sua solicitação.`
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