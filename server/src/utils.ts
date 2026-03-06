import crypto from "node:crypto";
import { networks, type Network } from "@btc-vision/bitcoin";
import { AddressTypes, AddressVerificator } from "@btc-vision/transaction";
import { config } from "./config.js";

export const SATS_PER_BTC = 100_000_000n;

export const nowIso = () => new Date().toISOString();

export const createId = () => crypto.randomUUID();

export const btcToSats = (amountBtc: string) => {
  const normalized = amountBtc.trim();
  if (!/^\d+(\.\d{1,8})?$/.test(normalized)) {
    throw new Error("Amount must be a BTC decimal string with up to 8 decimals");
  }

  const [wholePart, fractionalPart = ""] = normalized.split(".");
  const paddedFraction = (fractionalPart + "00000000").slice(0, 8);
  return (BigInt(wholePart) * SATS_PER_BTC + BigInt(paddedFraction)).toString();
};

export const satsToBtcDisplay = (amountSats: string) => {
  const amount = BigInt(amountSats);
  const whole = amount / SATS_PER_BTC;
  const fractional = (amount % SATS_PER_BTC).toString().padStart(8, "0").replace(/0+$/, "");
  return fractional.length > 0 ? `${whole}.${fractional}` : whole.toString();
};

export const buildQrPayload = (address: string, amountDisplay: string, memo?: string | null) => {
  if (address.toLowerCase().startsWith("op")) {
    const params = [];
    if (memo && memo.trim()) {
      params.push(`memo=${encodeURIComponent(memo.trim())}`);
    }
    params.push(`amount=${amountDisplay}`);
    return params.length > 0 ? `${address}?${params.join("&")}` : address;
  }

  const url = new URL(`bitcoin:${address}`);
  url.searchParams.set("amount", amountDisplay);
  if (memo && memo.trim()) {
    url.searchParams.set("message", memo.trim());
  }
  return url.toString();
};

export const getOpNetNetwork = (): Network => {
  switch (config.opnetNetwork) {
    case "mainnet":
      return networks.bitcoin;
    case "regtest":
      return networks.regtest;
    case "testnet":
    default:
      return networks.testnet;
  }
};

export const isLikelyOpNetAddress = (address: string) =>
  AddressVerificator.detectAddressType(address.trim(), getOpNetNetwork()) === AddressTypes.P2OP;

export const safeExplorerTxUrl = (txId: string | null) => {
  if (!txId) {
    return null;
  }
  return `${config.opnetRpcUrl.replace(/\/$/, "")}/tx/${txId}`;
};
