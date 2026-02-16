import 'dotenv/config';
import { enviarDadosDoCliente, LeadRegister, Task } from "../../adapters/backend"

export const sendClienteToAgenteHuman = async (dados: LeadRegister) => {
    try {
        await enviarDadosDoCliente({
            name_template: "chegou_mais_um_lead",
            dados,
            "phoneNumberId": "872884792582393"
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

        const bodyToRD = {
            email: dados.email,
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
        }
        return true;
    } catch (e: any) {
        console.log(e)
        return false;
    }
}