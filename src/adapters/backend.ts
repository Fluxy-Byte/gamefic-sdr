import axios from "axios";


export interface Task {
    name_template: string,
    dados: LeadRegister,
    phoneNumberId: string
}

export interface LeadRegister {
    nome: string,
    email?: string,
    contexto?: string,
    solucao?: string,
    produto?: string,
    nivelInteresse?: string,
    problemaCentral?: string,
    objetivoLead?: string,
    tomLead?: string,
    urgenciaLead?: string,
    instrucao?: string,
    localidade?: string,
    telefone: string,
    nomeAgente: string,
    telefoneAgente: string,
    problema?: string,
    etapa?: string,
}


export interface Metadata {
    display_phone_number: string
    phone_number_id: string
}


const BASE_BACKEND_URL = (process.env.ROTA_BACK_END ?? "https://fluxe-orquestrador.egnehl.easypanel.host").replace(/\/$/, "");

export async function enviarDadosDoCliente(dados: Task) {
    try {
        console.log(dados)
        const { data, status } = await axios.post(`${BASE_BACKEND_URL}/api/v1/vendas`,
            dados
        );

        console.log(`RETORNO ENVIO PARA FILA DE VENDAS: ${JSON.stringify(data)}`);
        return status ? true : false;
    } catch (e: any) {
        console.log(e)
        return false;
    }
}

export interface Task {
    name_template: string,
    dados: LeadRegister
}


export async function enviarDadosDoRegistroDeLead(phone: string, name: string, metadado: Metadata, context: string) {
    try {

        const { data, status } = await axios.post(`${BASE_BACKEND_URL}/api/v1/contact`,
            { phone, name, metadado, context }
        );

        console.log(data);
        return status ? true : false;
    } catch (e: any) {
        console.log(e)
        return false;
    }
}


export async function enviarDadosDaAtualizacaoDeNome(phone: string, name: string, metadado: Metadata) {
    try {

        const { data, status } = await axios.put(`${BASE_BACKEND_URL}/api/v1/contact`,
            { phone, name, metadado }
        );

        console.log(data);
        return status ? true : false;
    } catch (e: any) {
        console.log(e)
        return false;
    }
}


