export class TradingAPI {
    constructor(email, password, apiKey) {
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
        const accountArray = parsedResponse["accounts"]
        accountArray.forEach(async account => {
            if(account.accountName === "LuxAlgo-Test" && account.preferred === true) {
                this.accountId = account.accountId;
                console.log("Logged in!");
                return;
            } else {
                console.log("logging in...")
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
                console.log("Logged in!");
            }
        });
        
    }

    async openTrade(direction, stopLoss, takeProfit) {
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
                "size": 0.01,
                "guaranteedStop": false,
                "stopLevel": stopLoss,
                "profitLevel": takeProfit
            })
        });
        return response.json();
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
        return response.json();
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

    async getOpenTrades() {
        const response = await fetch("https://demo-api-capital.backend-capital.com/api/v1/positions", {
            method: "GET",
            headers: {
                "X-SECURITY-TOKEN": this.capitalcomSecurityToken,
                "CST": this.capitalcomCST,
                "Content-Type" : "application/json"
            }
        });
        const parsedPositions = JSON.parse(JSON.stringify(await response.json()))["positions"];
        var dealIdArray = [];
        if(parsedPositions.length !== 0) {
            parsedPositions.forEach(position => {
                console.log(position["position"])
                dealIdArray.push({
                    dealId: position["position"]["dealReference"],
                    direction: position["position"]["direction"]
                })
            });
        } else {
            return 0;
        }
        return dealIdArray;
    }
}