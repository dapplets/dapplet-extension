import { typeOfUri, UriTypes } from "../common/helpers";

export const isValidUrl = (input: string) => {
    const type = typeOfUri(input);

    if (type === UriTypes.Ens) return true;
    if (type === UriTypes.Ethereum) return true;
    if (type === UriTypes.Near) return true;
    if (type === UriTypes.Http) return true;

    return false;
}

export const isValidHttp = (url: string) => {
    try {
        new URL(url);
    } catch (_) {
        return false;
    }

    return true;
}

export const isValidPostageStampId = (id: string) => {
    return /^[0-9a-f]{64}$/gm.test(id);
}