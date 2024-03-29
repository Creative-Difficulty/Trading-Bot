import { logger } from "./index.js"

export class TradingAPI {
    email: string;
    password: string;
    apiKey: string;
    capitalcomCST: string;
    capitalcomSecurityToken: string;
    accountId: string;
    env: string;

    constructor(email: string, password: string, apiKey: string, envType: string) {
        this.email = email;
        this.password = password;
        this.apiKey = apiKey;
        this.env = envType;
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

        var accountIdToLogin = "175768302479824030";
        if(this.env === "TEST") {
            logger.info("Using Test account.");
            accountIdToLogin = "175996584286573726";
        } else {
            logger.info("Using Backtesting account.");
        }
        logger.info("Logging in...")
        const response2 = await fetch("https://demo-api-capital.backend-capital.com/api/v1/session", {
            method: "PUT",
            headers: {
                "X-SECURITY-TOKEN": capitalcomSecurityToken,
                "CST": capitalcomCST,
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({
                "accountId": accountIdToLogin
            })
        });
        const respJSON = await response2.json();
        if(respJSON.errorCode === "error.not-different.accountId") { logger.info("Already logged in."); return; }
        if(respJSON.errorCode === "error.invalid.accountId") { logger.error("Inavlid account Id"); return; }
        logger.info("Logged in!");

        setInterval(async () => {
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
            logger.info("Refreshed access token.");
        }, 540000);
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
        return respJSON;
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
        
        //TODO: Fix balance type
        var accountBalance: any;
        const respJSON = await response.json();
        const accountArray = respJSON["accounts"]
        accountArray.forEach(async (account: { accountName: string; balance: any; }) => {
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
        const parsedPositions: Array<{ position: { position: { dealReference: string, direction: string } } }> = respJSON["positions"];
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