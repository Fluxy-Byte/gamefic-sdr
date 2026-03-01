import axios from 'axios';
import { UpdateContact } from "./interface";

const BASE_BACKEND_URL = (process.env.ROTA_BACK_END ?? "https://fluxe-orquestrador.egnehl.easypanel.host").replace(/\/$/, "");

export async function createProblemToContact(contato: UpdateContact) {
    try {
        const responseCreateMeet = await axios.post(`${BASE_BACKEND_URL}/api/v1/contact-problema`,
            {
                "phone": contato.phone,
                "data_problema": contato.problemasContato?.data_do_problema ?? "Não coletada ou agente não captou",
                "contexto_da_conversa": contato.problemasContato?.contexto_da_conversa ?? "Nenhum contexto fornecido pelo agente",
                "local_do_problema": contato.problemasContato?.local_do_problema ?? "Local do problema não fornecido"
            }
        );

        console.log(`RETORNO CREATE MEET: ${JSON.stringify(responseCreateMeet.data)}`);
    } catch (e) {
        console.log(e);
        return false;
    }
}