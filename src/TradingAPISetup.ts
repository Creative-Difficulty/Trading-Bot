import { logger } from "./index.js"

export class TradingAPI {
    email: string;
    password: string;
    apiKey: string;
    capitalcomCST: string;
    capitalcomSecurityToken: string;
    accountId: string;

    constructor(email: string, password: string, apiKey: string) {
        this.email = email
        this.password = password
        this.apiKey = apiKey
    }

    async init() {
        const response1 = await fetch("https://demo-api-capital.backend-capital.com/api/v1/session", {
            method: "POST",
            headers: {
                "X-CAP-API-KEY": this.apiKey,
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({
                "identifier": this.email,
                "password": this.password
            })
        });

        const capitalcomSessionInitHeaders = Object.fromEntries(response1.headers);
        const capitalcomCST = capitalcomSessionInitHeaders["cst"];
        const capitalcomSecurityToken = capitalcomSessionInitHeaders["x-security-token"];
        this.capitalcomCST = capitalcomCST;
        this.capitalcomSecurityToken = capitalcomSecurityToken;

        const response2 = await fetch("https://demo-api-capital.backend-capital.com/api/v1/accounts", {
            method: "GET",
            headers: {
                "X-SECURITY-TOKEN": capitalcomSecurityToken,
                "CST": capitalcomCST,
                "Content-Type" : "application/json"
            }
        });
        const parsedResponse = JSON.parse(JSON.stringify(await response2.json()));
        const accountArray: Array<{ accountName: string, preferred: boolean, accountId: string }> = parsedResponse["accounts"]
        accountArray.forEach(async (account: { accountName: string, preferred: boolean, accountId: string }) => {
            if(account.accountName === "LuxAlgo-Backtest" && account.preferred === true) {
                this.accountId = account.accountId;
                logger.info("Logged in!");
                return;
            } else {
                logger.info("logging in...")
                await fetch("https://demo-api-capital.backend-capital.com/api/v1/session", {
                    method: "PUT",
                    headers: {
                        "X-SECURITY-TOKEN": capitalcomSecurityToken,
                        "CST": capitalcomCST,
                        "Content-Type" : "application/json"
                    },
                    body: JSON.stringify({
                        "accountId": this.accountId
                    })
                });
                logger.info("Logged in!");
            }
        });
        
    }

    async openTrade(direction: string) {
        const response = await fetch("https://demo-api-capital.backend-capital.com/api/v1/positions", {
            method: "POST",
            headers: {
                "X-SECURITY-TOKEN": this.capitalcomSecurityToken,
                "CST": this.capitalcomCST,
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({
                "epic": "BTCUSD",
                "direction": direction,
                "size": 0.01
            })
        });
        const respJSON = await response.json();
        const parsedResponse = JSON.parse(JSON.stringify(respJSON));
        return parsedResponse;
    }

    async closeTrade(tradeId) {
        const response = await fetch(`https://demo-api-capital.backend-capital.com/api/v1/positions/${tradeId}`, {
            method: "DELETE",
            headers: {
                "X-SECURITY-TOKEN": this.capitalcomSecurityToken,
                "CST": this.capitalcomCST,
                "Content-Type" : "application/json"
            }
        });
        const respJSON = await response.json();
        const parsedResponse = JSON.stringify(respJSON);
        return parsedResponse;
    }

    async getAccountLiquidity() {
        const response = await fetch("https://demo-api-capital.backend-capital.com/api/v1/accounts", {
            method: "GET",
            headers: {
                "X-SECURITY-TOKEN": this.capitalcomSecurityToken,
                "CST": this.capitalcomCST,
                "Content-Type" : "application/json"
            }
        });
        var accountBalance;
        const parsedResponse = JSON.parse(JSON.stringify(await response.json()));
        const accountArray = parsedResponse["accounts"]
        accountArray.forEach(async account => {
            if(account.accountName === "LuxAlgo-Test") {
                accountBalance = account.balance;
                return;
            }
        })

        return accountBalance;
    }

    async getOpenTrades(direction: "BUY" | "SELL" | "ALL"): Promise<Array<string>> {
        const response = await fetch("https://demo-api-capital.backend-capital.com/api/v1/positions", {
            method: "GET",
            headers: {
                "X-SECURITY-TOKEN": this.capitalcomSecurityToken,
                "CST": this.capitalcomCST,
                "Content-Type" : "application/json"
            }
        });
        const respJSON = await response.json();
        const parsedPositions: Array<{ position: { position: {dealReference: string, direction: string} } }> = JSON.parse(JSON.stringify(respJSON))["positions"];
        var dealIdArray: Array<string> = [];
        parsedPositions.forEach(async position => {
            if(direction === "ALL") {
                dealIdArray.push(position["position"]["dealId"]) 
            }

            if(position["position"]["direction"] === direction) {
                dealIdArray.push(position["position"]["dealId"]) 
            }
        });
        return dealIdArray;
    }
}