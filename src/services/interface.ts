export interface Task {
    nameTemplate: string,
    contato: UpdateContact,
    phoneNumberId: string,
    idWaba: number,
    phoneNotification: string
}

export interface UpdateContact {
    email?: string;
    name?: string;
    phone: string;
    empresa?: string;
    dadosReunia?: {
        data_reuniao: string;
        contexto_da_reuniao: string;
    }
    problemasContato?: {
        data_do_problema: string;
        local_do_problema: string;
        contexto_da_conversa: string;
    }
}