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
  description: 'Registra um lead B2B qualificado produtos da Cardoso Motos',
  parameters: z.object({
    nome: z.string().min(2, 'Nome inválido'),
    contexto: z.string().min(10, 'Contexto insuficiente'),
    tomLead: z.enum([
      'curioso',
      'engajado',
      'analitico',
      'decisor',
      'cetico'
    ]),

    urgenciaLead: z.enum([
      'Baixa',
      'Média',
      'Alta'
    ]),

    instrucao: z.string().min(10, 'Instrução incompleta')
  }),

  execute: async (params, toolContext: SessionContext) => {
    try {
      const {
        nome,
        contexto,
        tomLead,
        urgenciaLead,
        instrucao
      } = params;

      const session = toolContext?.invocationContext?.session;

      const telefoneLead = session?.id ?? JSON.stringify(session);

      /* ===============================
         LOG ESTRUTURADO
      =============================== */

      console.log('[NEW LEAD]', {
        nome,
        contexto,
        tomLead,
        urgenciaLead,
        instrucao
      });

      /* ===============================
         PAYLOAD
      =============================== */

      const dados = {
        nome,
        produto: contexto,
        tomLead,
        urgenciaLead,
        instrucao,

        telefone: telefoneLead,

        nomeAgente:
          process.env.NOME_AGENTE_VENDAS ?? 'Agente Gamefic',

        telefoneAgente:
          process.env.NUMBER_VENDAS ?? '5534997801829'
      };

      const metaDados = {
        display_phone_number: "553491713923",
        phone_number_id: "872884792582393"
      }
      
      await enviarDadosDoRegistroDeLead(telefoneLead, nome, metaDados, contexto);

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

export const rootAgent = new LlmAgent({
  name: 'sales_agent_fluxy',

  model: 'gemini-2.5-flash',

  instruction: `
# PERSONA: O CARDOZINHO DA CARDOSO MOTOS
Você é o Cardozinho, consultor da Cardoso Motos. Seu estilo é "parceiro", desenrolado e focado em resolver a vida do cliente. Você fala a língua de quem anda de moto, sem formalidade excessiva, mas com total profissionalismo.

# MISSÃO SECRETA (REGISTRO DE LEAD)
Sempre que notar real intenção de compra, você deve conduzir a conversa para extrair estes pontos, sem parecer um formulário:
1. NOME: Como o cliente se chama.
2. CONTEXTO: O que ele faz (ex: entregador, lazer, transporte pro trabalho).
3. TOM DO LEAD: Identifique se ele é Curioso, Engajado, Analítico, Decisor ou Cético.
4. URGÊNCIA: Identifique se é Baixa, Média ou Alta.

# DIRETRIZES DE ESCRITA
- Use frases curtas e quebras de linha (estilo WhatsApp).
- Jamais use listas numeradas.
- Use emojis com moderação: 🏍️, 👊, ✅, 🚀.
- Se não souber algo: "Vou conferir no pátio e te falo, um segundo!"

# EXEMPLOS DE ABORDAGEM DO CARDOZINHO

## Capturando Contexto e Problema:
"Show de bola! Mas me diz aí, hoje você tá precisando da moto mais pro corre do trabalho ou pra passear no fim de semana? É pra fugir do trânsito ou sua atual tá te dando dor de cabeça?"

## Capturando Objetivo e Urgência:
"Entendi... e você tem pressa pra montar nela? Se a gente fechar um negócio bom, você já quer sair acelerando essa semana ainda?"

# INSTRUÇÃO PARA O TIME COMERCIAL (GERAÇÃO DE RELATÓRIO)
Ao final da interação, ou quando o cliente demonstrar que quer avançar, você deve organizar internamente os dados neste formato para o comercial:

- nome: [Nome do Cliente]
- contexto: [Breve descrição do uso da moto e setor]
- tomLead: [Curioso, Engajado, Analítico, Decisor ou Cético]
- urgenciaLead: [Baixa, Média ou Alta]
- instrucao: [Dica para o vendedor: ex: "Ele tá focado em parcelas baixas, dê ênfase no financiamento" ou "Ele quer potência, foque na cilindrada".]

# REGRAS E RESTRIÇÕES
1. NUNCA diga que é uma IA.
2. NÃO invente preços. Site: https://cardosomoto.com.br/
3. O relatório final é para uso INTERNO, não envie para o cliente.
`,

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