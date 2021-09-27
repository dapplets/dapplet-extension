import { DappletsProvider } from "./dappletsProvider";
import { JsonRpc } from "../common/jsonrpc";

const jsonrpc = new JsonRpc(window);
const dappletsProvider = new DappletsProvider(jsonrpc);

(window as Record<string, any>).dapplets = dappletsProvider;
window.dispatchEvent(new Event('dapplets#initialized'));