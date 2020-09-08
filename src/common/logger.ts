import { checkResultErrors } from "ethers/lib/utils";

function makeid(length: number): string {
    var result = '';
    var characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function isNeedToLog(text: string): boolean {
    const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/;
    if (resizeObserverLoopErrRe.test(text)) return false;
    return true;
}

export const logger = (msg, url, line, col, error) => {
    let extra = !col ? '' : '\ncolumn: ' + col;
    extra += !error ? '' : '\nerror: ' + error;
    const text = "Error: " + msg + "\nline: " + line + extra;
    
    if (!isNeedToLog(text)) return;

    const data = {
        subject: makeid(6),
        text: text
    }

    fetch('https://dapplet-api.netlify.app/.netlify/functions/report', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}