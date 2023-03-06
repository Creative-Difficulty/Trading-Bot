import Fastify from 'fastify';
import * as dotenv from "dotenv";
import { TradingAPI } from "./TradingAPISetup.js";
import { Level } from "level";
dotenv.config();

const fastify = Fastify({ logger: true });

const capitalcomAPI = new TradingAPI(process.env.EMAIL, process.env.PASSWORD, process.env.APIKEY)
await capitalcomAPI.init();
const { balance, deposit, profitLoss, available } = await capitalcomAPI.getAccountLiquidity();

// const db = new Level("Trades", { valueEncoding: "json" })
fastify.post('/', async function (request, reply) {
    var data = request.body
    var alertData = JSON.parse(data).alertData
    console.log(alertData)
    //TODO: if trade open close trade first then check for enough liquidity to open new trade
    if(toString(alertData).replaceAll(" ", "").includes("Confirmation Strong Sell".replaceAll(" ", "")) && !toString(alertData.replaceAll(" ", "")).includes("Exit".replaceAll(" ", "")) || toString(alertData.replaceAll(" ", "")).includes("Normal Sell Turn Strong".replaceAll(" ", "")) && !toString(alertData.replaceAll(" ", "")).includes("Exit".replaceAll(" ", "")) || toString(alertData.replaceAll(" ", "")).includes("Confirmation Sell".replaceAll(" ", "")) && !toString(alertData.replaceAll(" ", "")).includesAll("Exit").replaceAll(" ", "")) {
        
        const openTrades = await capitalcomAPI.getOpenTrades();
        openTrades.forEach(trade => {
            if(trade.direction === "BUY") { capitalcomAPI.closeTrade(trade.dealId); console.log("Trade open in the opposite direction of signal, closing it")}
            if(trade.direction === "SELL") console.log("Trade in the same direction as signal already open keeping the trade open.")
        });

        if(openTrades === 0 || openTrades.length === 0) {
            await capitalcomAPI.openTrade("SELL", available/10, available/10);
        }
        //Risk 1% Reward 2%
    } else if(toString(alertData.replaceAll(" ", "")).includes("Confirmation Strong Buy".replaceAll(" ", "")) && !toString(alertData.replaceAll(" ", "")).includes("Exit".replaceAll(" ", "")) || toString(alertData.replaceAll(" ", "")).includes("Normal Buy Turn Strong".replaceAll(" ", "")) && !toString(alertData.replaceAll(" ", "")).includes("Exit".replaceAll(" ", "")) || toString(alertData.replaceAll(" ", "")).includes("Confirmation Buy".replaceAll(" ", "")) && !toString(alertData.replaceAll(" ", "")).includes("Exit".replaceAll(" ", ""))) {
        const openTrades = await capitalcomAPI.getOpenTrades();
        openTrades.forEach(trade => {
            if(trade.direction === "SELL") { capitalcomAPI.closeTrade(trade.dealId); console.log("Trade open in the opposite direction of signal, closing it")}
            if(trade.direction === "BUY") console.log("Trade in the same direction as signal already open, keeping the trade open.")
        });

        if(openTrades === 0 || openTrades.length === 0) {
            await capitalcomAPI.openTrade("BUY", available/10, available/10);
            const openTrades = await capitalcomAPI.getOpenTrades();
            console.log(`Buying Bitcoin @${openTrades.at(0)["level"]}`)
        }
    } else if(toString(alertData.replaceAll(" ", "")).startsWith("Confirmation Exit Buy".replaceAll(" ", ""))) {
        const openTrades = await capitalcomAPI.getOpenTrades();
        openTrades.forEach(trade => {
            if(trade.direction === "BUY") { capitalcomAPI.closeTrade(trade.dealId); console.log("Exit Long trade signal recieved, exiting!")}
            if(trade.direction === "SELL") console.log("Trade in the same direction as exit signal, keeping the trade open.")
        });
    } else if(toString(alertData.replaceAll(" ", "")).startsWith("Confirmation Exit Sell".replaceAll(" ", ""))) {
        const openTrades = await capitalcomAPI.getOpenTrades();
        openTrades.forEach(trade => {
            if(trade.direction === "SELL") { capitalcomAPI.closeTrade(trade.dealId); console.log("Exit Short trade signal recieved, exiting!")}
            if(trade.direction === "BUY") console.log("Trade in the same direction as exit signal, keeping the trade open.")
        });
    }

    
    reply.send({ status: "recieved" })
})

fastify.listen({ port: 3000 })


// const lol = await capitalcomAPI.openTrade("BUY", 20000, 25000)
// console.log(lol)




// const { capitalcomCST, capitalcomSecurityToken } = await openSession();
// const accounts = await getAccounts();
// if(JSON.parse(JSON.stringify(accounts))["accounts"][0]["accountName"] === "LuxAlgo-Test" && JSON.parse(JSON.stringify(accounts))["accounts"][0]["preferred"] === false) {
//     await switchAccount(JSON.parse(JSON.stringify(accounts))["accounts"][0]["accountId"])
// }

// // const { dealReference } = await openTrade("BUY", 21000, 25000)
// // console.log(dealReference)

// async function openSession() {
//     const response = await fetch("https://demo-api-capital.backend-capital.com/api/v1/session", {
//         method: "POST",
//         headers: {
//             "X-CAP-API-KEY": "SO6ZbQW5AIXmqE7A",
//             "Content-Type" : "application/json"
//         },
//         body: JSON.stringify({
//             "identifier": "dh2jttwtj5@privaterelay.appleid.com",
//             "password": "Neu9Sept!"
//         })
//     });

//     const capitalcomSessionInitHeaders = Object.fromEntries(response.headers);
//     const capitalcomCST = capitalcomSessionInitHeaders["cst"];
//     const capitalcomSecurityToken = capitalcomSessionInitHeaders["x-security-token"]
//     // console.log(`CST: ${capitalcomCST} SecurityToken: ${capitalcomSecurityToken}`)
//     return {
//         capitalcomCST,
//         capitalcomSecurityToken
//     }
// }

// // https://api-capital.backend-capital.com/ for normal api and https://demo-api-capital.backend-capital.com/ for demo
// async function getAccounts() {
//     const response = await fetch("https://demo-api-capital.backend-capital.com/api/v1/accounts", {
//         method: "GET",
//         headers: {
//             "X-SECURITY-TOKEN": capitalcomSecurityToken,
//             "CST": capitalcomCST,
//             "Content-Type" : "application/json"
//         }
//     });
//     return response.json();
// }

// async function switchAccount(accountID) {
//     console.log(accountID)
//     const response = await fetch("https://demo-api-capital.backend-capital.com/api/v1/session", {
//         method: "PUT",
//         headers: {
//             "X-SECURITY-TOKEN": capitalcomSecurityToken,
//             "CST": capitalcomCST,
//             "Content-Type" : "application/json"
//         },
//         body: JSON.stringify({
//             "accountId": accountID
//         })
//     });

//     const firstDemoAccount = await response.json()
//     return 0;
// }

// async function openTrade(direction, stopLoss, takeProfit) {
//     const response = await fetch("https://demo-api-capital.backend-capital.com/api/v1/positions", {
//         method: "POST",
//         headers: {
//             "X-SECURITY-TOKEN": capitalcomSecurityToken,
//             "CST": capitalcomCST,
//             "Content-Type" : "application/json"
//         },
//         body: JSON.stringify({
//             "epic": "BTCUSD",
//             "direction": direction,
//             "size": 0.01,
//             "guaranteedStop": false,
//             "stopLevel": stopLoss,
//             "profitLevel": takeProfit
//         })
//     });
    
//     // let dealReference = JSON.parse(JSON.stringify(response.json()))["dealReference"]
//     // if(dealReference in JSON.parse(JSON.stringify(response.json()))) {
//     //     return {
//     //        "dealReference": dealReference
//     //     };
//     // }
    
//     return response.json();
// }
