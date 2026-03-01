import 'dotenv/config';
import { createLeadInRdMarketing } from "./rd_station_crm";
import type { RdLeadPayload } from "./rd_station_crm";
import axios from 'axios';
import { UpdateContact } from "./interface";

const BASE_BACKEND_URL = (process.env.ROTA_BACK_END ?? "https://fluxe-orquestrador.egnehl.easypanel.host").replace(/\/$/, "")

export async function enviarLeadParaRD(payload: RdLeadPayload) {
    return createLeadInRdMarketing(payload);
}

export async function createMeetToContact(contato: UpdateContact) {
    try {
        const responseCreateMeet = await axios.post(`${BASE_BACKEND_URL}/api/v1/contact-reuniao`,
            {
                "phone": contato.phone,
                "data_reuniao": contato.dadosReunia?.data_reuniao ?? "Qualquer data",
                "contexto_da_reuniao": contato.dadosReunia?.contexto_da_reuniao ?? "Nenhum contexto fornecido pelo agente"
            }
        );

        console.log(`RETORNO CREATE MEET: ${JSON.stringify(responseCreateMeet.data)}`);
    } catch (e) {
        console.log(e);
        return false;
    }
}




// export const sendClienteToAgenteHuman = async (dados: Task) => {
//     try {
//         const normalizeEmpresa = (ctx?: string) => {
//             if (!ctx) return undefined;
//             const firstPart = ctx.split(',')[0].trim();
//             return firstPart.replace(/^Empresa\s+/i, '').trim();
//         };

//         const dealName = (() => {
//             const empresa = normalizeEmpresa(dados.contexto);
//             const cliente = dados.nome?.trim();
//             const cidade = "Não coletada";
//             return [empresa, cliente, cidade].filter(Boolean).join(' - ') ||
//                 dados.contexto ||
//                 dados.empresa ||
//                 dados.nome;
//         })();

//         const resultado = await enviarLeadParaRD({
//             email: dados.email ?? `agente${uuidv4(), new Date()}@fluxy.com`,
//             name: dados.nome,
//             phone: dados.telefone,
//             companyName: normalizeEmpresa(dados.contexto) ?? dados.contexto,
//             dealName,
//             tags: [
//                 "chegou_mais_um_lead",
//                 dados.contexto,
//                 dados.tomLead,
//                 dados.dataEHorario
//             ].filter(Boolean) as string[]
//         })

//         console.log(`LOG DO RETORNO DO RESULTADO: ${resultado}`)

//         return true;
//     } catch (e: any) {
//         console.log(e)
//         return false;
//     }
// }