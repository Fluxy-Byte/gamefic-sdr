import 'dotenv/config';
import { enviarDadosDoCliente, LeadRegister } from "../../adapters/backend"

export const error = async (dados: LeadRegister) => {
    try {
        // Adicionando a fila do lead
        await enviarDadosDoCliente({
            name_template: "error_lead",
            dados,
            "phoneNumberId": "1021940604341981"
        });
        return true;
    } catch (e: any) {
        console.log(e)
        return false;
    }
}