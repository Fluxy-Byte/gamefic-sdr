import 'dotenv/config';
import { enviarDadosDoCliente, LeadRegister, Task } from "../../adapters/backend";
import { createLeadInRdMarketing } from "./gerarLead";
import type { RdLeadPayload } from "./gerarLead";
import { v4 as uuidv4 } from 'uuid';

export const sendClienteToAgenteHuman = async (dados: LeadRegister) => {
    try {

        // Adicionando a fila do lead
        await enviarDadosDoCliente({
            name_template: "chegou_mais_um_lead",
            dados,
            "phoneNumberId": "1021940604341981"
        });

        const normalizeEmpresa = (ctx?: string) => {
            if (!ctx) return undefined;
            const firstPart = ctx.split(',')[0].trim();
            return firstPart.replace(/^Empresa\s+/i, '').trim();
        };

        const dealName = (() => {
            const empresa = normalizeEmpresa(dados.contexto);
            const cliente = dados.nome?.trim();
            const cidade = dados.localidade?.trim();
            return [empresa, cliente, cidade].filter(Boolean).join(' - ') ||
                dados.objetivoLead ||
                dados.problemaCentral ||
                dados.nome;
        })();

        const resultado = await enviarLeadParaRD({
            email: dados.email ?? `agente${uuidv4(),new Date()}@fluxy.com`,
            name: dados.nome,
            phone: dados.telefone,
            companyName: normalizeEmpresa(dados.contexto) ?? dados.contexto,
            dealName,
            tags: [
                "chegou_mais_um_lead",
                dados.nivelInteresse,
                dados.tomLead,
                dados.urgenciaLead
            ].filter(Boolean) as string[]
        })

        console.log(`LOG DO RETORNO DO RESULTADO: ${resultado}`)

        return true;
    } catch (e: any) {
        console.log(e)
        return false;
    }
}


export async function enviarLeadParaRD(payload: RdLeadPayload) {
    return createLeadInRdMarketing(payload);
}