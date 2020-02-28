export async function apiFetchDapplet(
    sowaId: string
): Promise<any> {
    const response = await fetch(`https://dapplets.github.io/dapplet-examples/${sowaId}.json`);
    const result = await response.json();
    return result;
}