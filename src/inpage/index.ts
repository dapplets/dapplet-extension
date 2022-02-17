import { DappletsProvider } from "./dappletsProvider";
import { JsonRpc } from "../common/jsonrpc";
import { GlobalEventBus } from "./globalEventBus";

const jsonrpc = new JsonRpc(window);
const globalEventBus = new GlobalEventBus(jsonrpc);
const dappletsProvider = new DappletsProvider(jsonrpc, globalEventBus);

(window as Record<string, any>).dapplets = dappletsProvider;
window.dispatchEvent(new Event('dapplets#initialized'));