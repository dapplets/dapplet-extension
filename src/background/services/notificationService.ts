import * as extension from 'extensionizer';
import { generateGuid } from '../../common/utils';

const transactionCreated = async transactionId => {
    return new Promise(function (resolve, reject) {
        extension.notifications.create(
            transactionId,
            {
                type: "basic",
                iconUrl: "icons/icon128.png",
                title: "Transaction created",
                message: "Click to check the status on Etherscan"
            },
            resolve
        );
    });
};

const transactionRejected = async () => {
    return new Promise(function (resolve, reject) {
        extension.notifications.create(
            generateGuid(),
            {
                type: "basic",
                iconUrl: "icons/icon128.png",
                title: "Transaction rejected",
                message: "Try again if you didn't reject it"
            },
            resolve
        );
    });
};

export { transactionCreated, transactionRejected };
