import { config } from "../config.js";

let chainAdapterPromise: Promise<import("../chain/opnetAdapter.js").OpNetChainAdapter> | null = null;

export const getChainAdapter = async () => {
  if (!chainAdapterPromise) {
    chainAdapterPromise = (async () => {
      const [{ networks }, { JSONRpcProvider }, { OpNetChainAdapter }] = await Promise.all([
        import("@btc-vision/bitcoin"),
        import("opnet"),
        import("../chain/opnetAdapter.js")
      ]);

      const network =
        config.opnetNetwork === "mainnet"
          ? networks.bitcoin
          : config.opnetNetwork === "regtest"
            ? networks.regtest
            : networks.testnet;

      const provider = new JSONRpcProvider(config.opnetRpcUrl, network);
      return new OpNetChainAdapter(provider);
    })();
  }

  return chainAdapterPromise;
};
