import 'dotenv/config';
import { refreshRdTokenNow } from '../src/services/rd_station_crm';

async function main() {
  try {
    console.log('[RD_STATION] Disparando refresh manual...');
    const result = await refreshRdTokenNow();
    console.log('[RD_STATION] Refresh manual concluido com sucesso.', result);
    process.exitCode = 0;
  } catch (error) {
    console.error('[RD_STATION] Refresh manual falhou.', {
      message: (error as Error)?.message ?? error
    });
    process.exitCode = 1;
  }
}

void main();

