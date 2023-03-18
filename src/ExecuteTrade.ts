import { logger, capitalcomAPI } from "./index.js"
export async function executeTrade(tradeDirection: { action: "ENTER" | "EXIT", direction: "BUY" | "SELL" }) {
    const formalTradeDirection: "long" | "short" = tradeDirection.direction === "BUY" ? "long" : "short";
    const reversedFormalTradeDirection: "long" | "short" = formalTradeDirection === "long" ? "short" : "long";
    const reversedTradeDirection: "BUY" | "SELL" = tradeDirection.direction === "BUY" ? "SELL" : "BUY";

    if(tradeDirection["action"] === "ENTER") {
        const openTrades = await capitalcomAPI.getOpenTrades(reversedTradeDirection);
        if(openTrades.length === 0) { 
            logger.info(`No open ${reversedFormalTradeDirection} trades to exit.`);
        } else {
            openTrades.forEach(async trade => {
                const resp = await capitalcomAPI.closeTrade(trade); 
                logger.info(`Closed ${reversedFormalTradeDirection} trade because of ${formalTradeDirection} signal with id ${trade}: ${resp}`);
            });
        }
        const dealReference = await capitalcomAPI.openTrade(tradeDirection.direction);
        logger.info(`Opened ${formalTradeDirection} trade with ID: ${dealReference["dealReference"]}`) 
    }

    if(tradeDirection["action"] === "EXIT") {
        const openTrades = await capitalcomAPI.getOpenTrades(tradeDirection.direction);
        if(openTrades.length === 0) {
            logger.info(`No open ${formalTradeDirection} trades to exit.`);
        } else {
            openTrades.forEach(async trade => {
                const resp = await capitalcomAPI.closeTrade(trade); 
                logger.info(`Closed ${formalTradeDirection} trade because of exit signal with id ${trade}: ${resp}`);
            });
        }
    }
}