import Fastify from 'fastify';
import * as dotenv from "dotenv";
import { TradingAPI } from "./TradingAPISetup.js";
import { getDirectionFromAlert } from "./analyseAlert.js";
import { pino } from "pino";
import path from "path";
import { executeTrade } from './ExecuteTrade.js';

const __dirname = path.resolve();
// For docs see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
const logFileName = new Date().toISOString() + ".log"
const logPath = path.join(__dirname, "logs", logFileName);

export const logger = pino({
    transport: {
        targets: [
            { level:"debug", target: "pino/file", options: { destination: logPath, mkdir: true } },
            { level: "debug", target: "pino/file", options: { } }
        ]
    },
    timestamp: pino.stdTimeFunctions.isoTime
});

dotenv.config();

const fastify = Fastify({ logger: logger });

export const capitalcomAPI = new TradingAPI(process.env.EMAIL, process.env.PASSWORD, process.env.APIKEY, process.env.ENV)
await capitalcomAPI.init();

fastify.post('/', async function (request, reply) {
    // const { balance, deposit, profitLoss, available } = await capitalcomAPI.getAccountLiquidity();
    var data: any = request.body
    var alertData = JSON.parse(data).alertData
    logger.info(alertData);
    //TODO: if trade open close trade first then check for enough liquidity to open new trade
    const tradeDirection = await getDirectionFromAlert(alertData);
    await executeTrade(tradeDirection);

    reply.send({ status: "recieved" })
})

fastify.listen({port: 3000, host: "0.0.0.0"})