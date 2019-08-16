export type DappletConfig = {
    "@context": {
        [type: string]: string
    }

    views: {
        "@type": string,
        template: string
    }[]

    transactions: {
        [name: string]: any
    }
}