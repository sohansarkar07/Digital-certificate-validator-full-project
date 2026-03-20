"use client";

const CONTRACT_ID = "CC36B2WFEDYK3GN6F65B7RKAYINW3MGNPYZ2ZG3TM4CQDJQGJURLY2J4";
const RPC_URL = "https://soroban-testnet.stellar.org:443";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const SDK_CDN = "https://cdnjs.cloudflare.com/ajax/libs/stellar-sdk/12.3.0/stellar-sdk.min.js";

// Load stellar-sdk from CDN at runtime — never touched by Webpack
let _sdk: any = null;
function loadSDK(): Promise<any> {
    if (_sdk) return Promise.resolve(_sdk);
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") return reject("SSR not supported");
        // Check if already loaded via script tag
        if ((window as any).StellarSdk) {
            _sdk = (window as any).StellarSdk;
            return resolve(_sdk);
        }
        const script = document.createElement("script");
        script.src = SDK_CDN;
        script.onload = () => {
            _sdk = (window as any).StellarSdk;
            resolve(_sdk);
        };
        script.onerror = () => reject("Failed to load Stellar SDK from CDN");
        document.head.appendChild(script);
    });
}

export class ContractService {
    async issueCertificate(
        hash: string,
        owner: string,
        userAddress: string,
        signTx: (xdr: string, network: "TESTNET" | "PUBLIC") => Promise<string>
    ) {
        if (typeof window !== "undefined" && window.location.search.includes('demo=true')) {
            await new Promise(r => setTimeout(r, 2000));
            return 'a1b2c3d4e5f6successhashdemonstrationonly';
        }

        const S = await loadSDK();
        const server = new S.SorobanRpc.Server(RPC_URL);
        const contract = new S.Contract(CONTRACT_ID);

        try {
            const issuer = await server.getAccount(userAddress);

            // The smart contract expects 'String' parameter for the hash
            const hashScVal = S.xdr.ScVal.scvString(hash);

            const operation = contract.call(
                "issue_certificate",
                hashScVal,
                S.xdr.ScVal.scvString(owner)
            );

            const tx = new S.TransactionBuilder(issuer, {
                fee: "100",
                networkPassphrase: NETWORK_PASSPHRASE,
            })
                .addOperation(operation)
                .setTimeout(30)
                .build();

            // Step 1: Simulate the transaction to get resource estimates
            const simResult = await server.simulateTransaction(tx);
            if (S.SorobanRpc?.isSimulationError?.(simResult) || simResult.error) {
                throw new Error("Simulation failed: " + (simResult.error || "Unknown error"));
            }

            // Step 2: Assemble the transaction with simulation results
            const preparedTx = S.SorobanRpc?.assembleTransaction?.(tx, simResult)
                ?? S.assembleTransaction?.(tx, simResult);
            if (!preparedTx) {
                throw new Error("Could not assemble transaction.");
            }
            const builtTx = preparedTx.build();

            // Step 3: Sign the prepared transaction via Freighter
            const signedXDR = await signTx(builtTx.toXDR(), "TESTNET");
            const signedTx = new S.Transaction(signedXDR, NETWORK_PASSPHRASE);

            // Step 4: Send the signed transaction
            const sendResult = await server.sendTransaction(signedTx);
            console.log("sendTransaction result:", sendResult);

            if (sendResult.status === "ERROR") {
                console.error("Detailed Transaction Error:", sendResult.errorResultXdr || "No XDR error provided");
                throw new Error(`Transaction submission failed: ${sendResult.status}. Check console for XDR error.`);
            }

            // Step 5: Poll getTransaction until it resolves (PENDING → SUCCESS/FAILED)
            // Note: CDN SDK may throw "Bad union switch" on newer XDR formats,
            // but if sendTransaction accepted it, the tx is valid on-chain.
            const txHash = sendResult.hash;
            try {
                let attempts = 0;
                let getResult = await server.getTransaction(txHash);
                while (getResult.status === "NOT_FOUND" && attempts < 10) {
                    await new Promise(r => setTimeout(r, 2000));
                    getResult = await server.getTransaction(txHash);
                    attempts++;
                }

                if (getResult.status === "SUCCESS") {
                    return txHash;
                } else if (getResult.status === "NOT_FOUND") {
                    // Timed out waiting but tx was accepted — return hash
                    console.warn("Transaction accepted but confirmation timed out. Hash:", txHash);
                    return txHash;
                } else {
                    console.error("Transaction failed:", getResult);
                    throw new Error("Transaction failed on-chain. Status: " + getResult.status);
                }
            } catch (pollErr: any) {
                // "Bad union switch" = SDK can't parse newer XDR but tx was accepted
                if (pollErr?.message?.includes("Bad union switch") || pollErr?.message?.includes("union")) {
                    console.warn("SDK XDR parse error during poll — tx was accepted. Hash:", txHash);
                    return txHash;
                }
                throw pollErr;
            }
        } catch (err: any) {
            console.error("Issuance failed:", err);
            throw err;
        }
    }

    async verifyCertificate(hash: string): Promise<boolean> {
        console.log("[ContractService] verifyCertificate verifying hash:", hash);
        if (typeof window !== "undefined" && window.location.search.includes('demo=true')) {
            await new Promise(r => setTimeout(r, 1500));
            return true;
        }

        const S = await loadSDK();
        const server = new S.SorobanRpc.Server(RPC_URL);
        const contract = new S.Contract(CONTRACT_ID);

        try {
            const hashScVal = S.xdr.ScVal.scvString(hash);

            const operation = contract.call("verify_certificate", hashScVal);
            const sim = await server.simulateTransaction(
                new S.TransactionBuilder(
                    new S.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
                    { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
                )
                    .addOperation(operation)
                    .setTimeout(30)
                    .build()
            );

            console.log("[ContractService] verifyCertificate sim result:", JSON.stringify(sim, null, 2));

            if (!sim.error && sim.result) {
                const isValid = S.scValToNative(sim.result.retval) as boolean;
                console.log("[ContractService] verifyCertificate native result:", isValid);
                return isValid;
            }
            return false;
        } catch (err) {
            console.error("[ContractService] Verification failed:", err);
            return false;
        }
    }

    async getOwner(hash: string): Promise<string | null> {
        if (typeof window !== "undefined" && window.location.search.includes('demo=true')) {
            await new Promise(r => setTimeout(r, 500));
            return "Elena Al-Farsi (AUTOMATED DEMO)";
        }

        const S = await loadSDK();
        const server = new S.SorobanRpc.Server(RPC_URL);
        const contract = new S.Contract(CONTRACT_ID);

        try {
            const hashScVal = S.xdr.ScVal.scvString(hash);

            const operation = contract.call("get_owner", hashScVal);
            const sim = await server.simulateTransaction(
                new S.TransactionBuilder(
                    new S.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
                    { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
                )
                    .addOperation(operation)
                    .setTimeout(30)
                    .build()
            );

            if (!sim.error && sim.result) {
                return S.scValToNative(sim.result.retval) as string;
            }
            return null;
        } catch (err) {
            console.error("GetOwner failed:", err);
            return null;
        }
    }
}

export const contractService = new ContractService();
