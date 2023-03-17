import Fastify from 'fastify';
import * as dotenv from "dotenv";
import { TradingAPI } from "./TradingAPISetup.js";
import { getDirectionFromAlert } from "./analyseAlert.js";
import { pino } from "pino";
import path from "path";

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

const fastify = Fastify({logger: logger});

const capitalcomAPI = new TradingAPI(process.env.EMAIL, process.env.PASSWORD, process.env.APIKEY, process.env.ENV)
await capitalcomAPI.init();

fastify.post('/', async function (request, reply) {
    // const { balance, deposit, profitLoss, available } = await capitalcomAPI.getAccountLiquidity();
    var data: any = request.body
    var alertData = JSON.parse(data).alertData
    logger.info(alertData);
    //TODO: if trade open close trade first then check for enough liquidity to open new trade
    const tradeDirection = await getDirectionFromAlert(alertData);
    if(tradeDirection["action"] === "ENTER" && tradeDirection["direction"] === "BUY") { const dealId = await capitalcomAPI.openTrade("BUY"); logger.info(`Opened long trade with ID: ${dealId["dealReference"]}`) }
    if(tradeDirection["action"] === "ENTER" && tradeDirection["direction"] === "SELL") { const dealId = await capitalcomAPI.openTrade("SELL"); logger.info(`Opened short trade with ID: ${dealId["dealReference"]}`) }
    if(tradeDirection["action"] === "EXIT" && tradeDirection["direction"] === "BUY") {
        const openTrades = await capitalcomAPI.getOpenTrades("BUY");
        if(openTrades.length === 0) { 
            logger.info("No open long trades to exit");
        } else {
            openTrades.forEach(async trade => {
                const resp = await capitalcomAPI.closeTrade(trade); 
                logger.info(`Closed long trade with id ${trade}: ${resp}`)
            });
        }
    }

    if(tradeDirection["action"] === "EXIT" && tradeDirection["direction"] === "SELL") {
        const openTrades = await capitalcomAPI.getOpenTrades("SELL");
        if(openTrades.length === 0) { 
            logger.info("No open short trades to exit");
        } else {
            openTrades.forEach(async trade => {
                const resp = await capitalcomAPI.closeTrade(trade); 
                logger.info(`Closed short trade with id ${trade}: ${resp}`)
            });
        }
    }

    reply.send({ status: "recieved" })
})

fastify.listen({port: 3000, host: "0.0.0.0"})