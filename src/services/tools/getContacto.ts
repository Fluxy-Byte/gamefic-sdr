import axios from "axios";
import { Contact } from "@/adapters/inteface"

const BASE_BACKEND_URL = (process.env.ROTA_BACK_END ?? "https://fluxe-orquestrador.egnehl.easypanel.host").replace(/\/$/, "");

export async function getContact(phone: string) {
    try {
        const { data } = await axios.get(`${BASE_BACKEND_URL}/api/v1/contact?phone=${phone}`);
        const resultado: Result = data;

        if (resultado.contato) {
            return {
                phone,
                name: resultado.contato.name,
                email: resultado.contato.email,
                empresa: resultado.contato.empresa
            }
        } else {
            return {
                phone,
                name: "",
                email: "",
                empresa: ""
            }
        }

    } catch (e: any) {
        console.log(e);
        return {
            phone,
            name: "",
            email: "",
            empresa: ""
        }
    }
}

interface Result {
    status: boolean,
    message: string
    contato: Contact | null
}
