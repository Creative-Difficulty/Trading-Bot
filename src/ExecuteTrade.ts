import { logger, capitalcomAPI } from "./index.js"
export async function executeTrade(tradeDirection: { action: string, direction: string }) {
    // const formalTradeDirection = tradeDirection.direction === "BUY" ? "long" : "short";
    if(tradeDirection["action"] === "ENTER" && tradeDirection["direction"] === "BUY") { 
        const openTrades = await capitalcomAPI.getOpenTrades("SELL");
        if(openTrades.length === 0) { 
            logger.info("No open short trades to exit");
        } else {
            openTrades.forEach(async trade => {
                const resp = await capitalcomAPI.closeTrade(trade); 
                logger.info(`Closed short trade because of long signal with id ${trade}: ${resp}`);
            });
        }
        const dealId = await capitalcomAPI.openTrade("BUY"); 
        logger.info(`Opened long trade with ID: ${dealId["dealReference"]}`) 
    }

    if(tradeDirection["action"] === "ENTER" && tradeDirection["direction"] === "SELL") { 
        const openTrades = await capitalcomAPI.getOpenTrades("BUY");
        if(openTrades.length === 0) { 
            logger.info("No open long trades to exit");
        } else {
            openTrades.forEach(async trade => {
                const resp = await capitalcomAPI.closeTrade(trade); 
                logger.info(`Closed long trade because of short signal with id ${trade}: ${resp}`);
            });
        }
        const dealId = await capitalcomAPI.openTrade("SELL");
        logger.info(`Opened short trade with ID: ${dealId["dealReference"]}`);
    }
    
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
}