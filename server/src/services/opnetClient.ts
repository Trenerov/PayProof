import { networks } from "@btc-vision/bitcoin";
import { JSONRpcProvider } from "opnet";
import { OpNetChainAdapter } from "../chain/opnetAdapter.js";
import { config } from "../config.js";

const network =
  config.opnetNetwork === "mainnet"
    ? networks.bitcoin
    : config.opnetNetwork === "regtest"
      ? networks.regtest
      : networks.testnet;

export const opnetProvider = new JSONRpcProvider(config.opnetRpcUrl, network);
export const chainAdapter = new OpNetChainAdapter(opnetProvider);
