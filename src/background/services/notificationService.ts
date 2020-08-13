import { browser } from "webextension-polyfill-ts";
import { generateGuid } from '../../common/utils';

const transactionCreated = async transactionId => {
    return browser.notifications.create(
        transactionId,
        {
            type: "basic",
            iconUrl: "icons/icon128.png",
            title: "Transaction created",
            message: "Click to check the status on Etherscan"
        }
    );
};

const transactionRejected = async () => {
    return browser.notifications.create(
        generateGuid(),
        {
            type: "basic",
            iconUrl: "icons/icon128.png",
            title: "Transaction rejected",
            message: "Try again if you didn't reject it"
        },
    );
};

export { transactionCreated, transactionRejected };
