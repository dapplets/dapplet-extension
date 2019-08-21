export async function apiFetchDapplet(
    dappletId: string
): Promise<any> {
    const response = await fetch(`https://dapplets.github.io/dapplet-examples/${dappletId}.json`);
    const result = await response.json();
    return result;
}