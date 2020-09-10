import { browser } from "webextension-polyfill-ts";

export const error = async (...args: any[]) => {
    console.error.apply(console, args);

    const isReport = await _isReportingEnabled();

    if (!isReport || args.length === 0) return;
    
    const text = (args[0] instanceof Error) ? args[0].message + '\n' + args[0].stack : args[0].toString();

    if (!_isNeedToLog(text)) return;

    await _report(text);
}

export const log = async (msg, url, line, col, error) => {
    console.error.apply(console, [msg, url, line, col, error]);

    const isReport = await _isReportingEnabled();
    if (!isReport) return;
    
    let extra = !col ? '' : '\ncolumn: ' + col;
    extra += !error ? '' : '\nerror: ' + error;
    const text = "Error: " + msg + "\nline: " + line + extra;

    if (!_isNeedToLog(text)) return;

    await _report(text);
}

function _makeid(length: number): string {
    var result = '';
    var characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function _isNeedToLog(text: string): boolean {
    if (text.indexOf('ResizeObserver loop limit exceeded') !== -1) return false;
    return true;
}

async function _isReportingEnabled(): Promise<boolean> {
    const config = await browser.storage.local.get('GlobalConfig:default');
    return config?.['GlobalConfig:default']?.['errorReporting'] || true;
}

async function _report(text) {
    const data = {
        subject: _makeid(6),
        text: text
    }

    return fetch('https://dapplet-api.netlify.app/.netlify/functions/report', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}