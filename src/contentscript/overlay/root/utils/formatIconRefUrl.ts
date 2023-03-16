
const IPFS_GATEWAY ="https://ipfs-gateway.mooo.com"
const formatIconRefUrl = (rawUrl: string) => {
	const addr = rawUrl.split("//").pop();
	const newAddr = addr?.includes("ipfs-gateway.mooo.com")
		? addr.replace("ipfs-gateway.mooo.com/ipfs/", "")
		: addr;

	return `${IPFS_GATEWAY}/ipfs/${newAddr}`;
};

export default formatIconRefUrl;
