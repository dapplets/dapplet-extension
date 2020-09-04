function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export const logger = (msg, url, line, col, error) => {
    let extra = !col ? '' : '\ncolumn: ' + col;
    extra += !error ? '' : '\nerror: ' + error;
    const text = "Error: " + msg + "\nurl: " + url + "\nline: " + line + extra;
    const data = {
        subject: makeid(6),
        text: text,
        key: 'CPdGSx9PCFmrILjVitHQiHZfHTM6bI5ZKYyZhqs1168RmyFdTGkBSS8DJ8p0ETL8'
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