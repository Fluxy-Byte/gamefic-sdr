import axios from "axios";
import { Contact } from "@/adapters/inteface"
import { UpdateContact } from "./interface";

const BASE_BACKEND_URL = (process.env.ROTA_BACK_END ?? "https://fluxe-orquestrador.egnehl.easypanel.host").replace(/\/$/, "");

export async function getContact(phone: string) {
    try {
        console.log(`Buscando contato com telefone: ${phone}`);
        const { data } = await axios.get(`${BASE_BACKEND_URL}/api/v1/contact?phone=${phone}`);
        const resultado: Result = data;
       // console.log(`RETORNO GET CONTATO: ${JSON.stringify(resultado)}`);
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
        console.log(`Erro ao buscar contato com telefone: ${phone}. Retornando contato vazio.`);
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

export async function updateContact(contato: UpdateContact) {
    try {
        const responseUpdateUser = await axios.put(`${BASE_BACKEND_URL}/api/v1/contact`,
            {
                email: contato.email,
                name: contato.name,
                phone: contato.phone,
                empresa: contato.empresa
            }
        );

        console.log(`RETORNO UPDATE CONTATO: ${JSON.stringify(responseUpdateUser.data)}`);

    } catch (e) {
        console.log(e);
        return false;
    }
}

export async function updateNameContact(phone: string, name: string) {
    try {
        const responseUpdateUser = await axios.put(`${BASE_BACKEND_URL}/api/v1/contact/name`,
            {
                name: name,
                phone: phone
            }
        );

        console.log(`RETORNO UPDATE NAME CONTATO: ${JSON.stringify(responseUpdateUser.data)}`);
    } catch (e) {
        console.log(e);
        return false;
    }
}