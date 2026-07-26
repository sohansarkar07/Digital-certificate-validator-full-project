"use client";
import { dbInsertTransaction } from "@/lib/db";
import type { TransactionEntry } from "@/lib/db";

// Simulated delay to mimic blockchain consensus time (approx 3-5 seconds on Stellar)
const SIMULATE_NETWORK_DELAY = true;

/**
 * Generates a random 64-character hex string to simulate a Stellar transaction hash.
 */
function generateTxHash(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  // Fallback for non-browser environments
  let result = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Formats a Stellar Expert explorer link for a given transaction hash.
 */
function getExplorerLink(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

/**
 * Records a blockchain transaction event.
 * In a fully production environment, this would sign and submit an actual Soroban transaction,
 * wait for network consensus, and then record the resulting hash.
 * Here we simulate the network delay and hash generation, then store it in our immutable ledger (Supabase).
 */
export async function recordTransaction(
  eventType: string,
  walletAddress: string,
  role?: string,
  status: "success" | "failed" | "pending" = "success",
  txHash?: string
): Promise<TransactionEntry> {
  // Simulate consensus delay (1.5 to 3 seconds) to feel like a real blockchain if no real hash provided
  if (SIMULATE_NETWORK_DELAY && !txHash) {
    const delay = Math.floor(Math.random() * 1500) + 1500;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  const hash = txHash || generateTxHash();
  const explorer_link = txHash ? getExplorerLink(txHash) : undefined;
  const network = "Stellar Testnet";

  const entry: TransactionEntry = {
    hash,
    event_type: eventType,
    wallet_address: walletAddress,
    role: role || "unknown",
    network,
    explorer_link,
    status,
  };

  // Persist to the global transaction history
  await dbInsertTransaction(entry);
  
  console.log(`[Blockchain] Tx Confirmed: ${eventType} | Hash: ${hash.substring(0, 10)}...`);
  return entry;
}
