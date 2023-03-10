export async function getDirectionFromAlert(alert: string): Promise<{ action: "ENTER" | "EXIT", direction: "BUY" | "SELL"}> {
    if(alert.includes("Buy") && !alert.includes("Exit")) return { action: "ENTER", direction: "BUY"};
    if(alert.includes("Sell") && !alert.includes("Exit")) return { action: "ENTER", direction: "SELL"};
    if(alert.includes("Sell") && alert.includes("Exit")) return { action: "EXIT", direction: "SELL"};
    if(alert.includes("Buy") && alert.includes("Exit")) return { action: "EXIT", direction: "BUY"};
}