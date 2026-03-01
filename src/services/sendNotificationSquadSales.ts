import axios from "axios";
import { Task, UpdateContact } from "./interface";

export async function sendNotificationSquadSales(nameTemplate: string, phone: string, phoneNumberId: string) {
    try {
        const response = await axios.post(`${process.env.ROTA_BACK_END}/api/v1/vendas`,
            {
                nameTemplate,
                phone,
                phoneNumberId
            }
        );

        return response.data;

    } catch (e) {
        console.log(e)
        return false;
    }
}