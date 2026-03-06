import { JSONRpcProvider } from "opnet";

export type ChainTx = {
  txId: string;
  blockNumber: number | null;
  confirmations: number;
  outputs: Array<{ address: string; valueSats: string }>;
};

export interface ChainAdapter {
  getCurrentBlockNumber(): Promise<number>;
  getTxsByAddress(address: string, sinceBlockNumber?: number): Promise<ChainTx[]>;
}

export class OpNetChainAdapter implements ChainAdapter {
  constructor(private readonly provider: JSONRpcProvider) {}

  async getCurrentBlockNumber() {
    return Number(await this.provider.getBlockNumber());
  }

  async getTxsByAddress(address: string, sinceBlockNumber = 0) {
    const [currentBlockNumber, utxos] = await Promise.all([
      this.getCurrentBlockNumber(),
      this.provider.utxoManager.getUTXOs({
        address,
        optimize: false,
        mergePendingUTXOs: true,
        filterSpentUTXOs: false
      })
    ]);

    const sumsByTransaction = new Map<string, bigint>();
    for (const utxo of utxos) {
      sumsByTransaction.set(
        utxo.transactionId,
        (sumsByTransaction.get(utxo.transactionId) ?? 0n) + utxo.value
      );
    }

    const txs = await Promise.all(
      [...sumsByTransaction.entries()].map(async ([txId, value]) => {
        const transaction = await this.provider.getTransaction(txId);
        const blockNumber = transaction.blockNumber === undefined ? null : Number(transaction.blockNumber);
        const confirmations =
          blockNumber === null ? 0 : Math.max(0, currentBlockNumber - blockNumber + 1);

        return {
          txId,
          blockNumber,
          confirmations,
          outputs: [{ address, valueSats: value.toString() }]
        } satisfies ChainTx;
      })
    );

    return txs
      .filter((tx) => tx.blockNumber === null || tx.blockNumber >= sinceBlockNumber)
      .sort((left, right) => (left.blockNumber ?? Number.MAX_SAFE_INTEGER) - (right.blockNumber ?? Number.MAX_SAFE_INTEGER));
  }
}
