class Storage {
    // When Chrome is offline, Chrome stores the data locally. 
    // The next time the browser is online, Chrome syncs the data. 
    // Even if a user disables syncing, storage.sync will still work. 
    // In this case, it will behave identically to storage.local.

    static getLocal (key) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([key], function (result) {
                resolve(result[key]);
            });
        });
    }

    static setLocal (key, value) {
        return new Promise((resolve, reject) => {
            var data = {};
            data[key] = value;
            chrome.storage.local.set(data, function() {
                resolve();
            });
        });
    }

    // When using storage.sync, the stored data will automatically be synced
    // to any Chrome browser that the user is logged into, provided the user has sync enabled.
    
    static getSync (key) {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get([key], function (result) {
                resolve(result[key]);
            });
        });
    }

    static setSync (key, value) {
        return new Promise((resolve, reject) => {
            var data = {};
            data[key] = value;
            chrome.storage.sync.set(data, function() {
                resolve();
            });
        });
    }
}

export default Storage;