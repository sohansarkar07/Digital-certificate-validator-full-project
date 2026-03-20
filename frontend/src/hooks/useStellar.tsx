"use client";

import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { isConnected as checkFreighter, getAddress as getFreighterAddr, signTransaction as signFreighter, requestAccess } from '@stellar/freighter-api';

export type WalletType = 'freighter' | 'albedo' | 'xbull' | 'metamask' | 'lobstr' | null;

interface StellarContextType {
    address: string | null;
    isConnected: boolean;
    connecting: boolean;
    error: string | null;
    walletType: WalletType;
    connect: (type?: WalletType) => Promise<void>;
    disconnect: () => void;
    sign: (xdr: string, network: "TESTNET" | "PUBLIC") => Promise<any>;
}

const StellarContext = createContext<StellarContextType | undefined>(undefined);

export function StellarProvider({ children }: { children: ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [walletType, setWalletType] = useState<WalletType>(null);

    const connect = useCallback(async (type?: WalletType) => {
        setConnecting(true);
        setError(null);
        try {
            if (window.location.search.includes('demo=true')) {
                setAddress('GBDEMOMOCKADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
                setWalletType('freighter');
                return;
            }

            const selectedType = type || 'freighter';

            if (selectedType === 'freighter') {
                const connResult = await checkFreighter();
                const connected = typeof connResult === 'object' ? connResult.isConnected : connResult;
                
                if (connected) {
                    const accessResult = await requestAccess();
                    if ((accessResult as any).error) throw new Error((accessResult as any).error);
                    const addr = typeof accessResult === 'object' ? (accessResult as any).address : accessResult;
                    if (!addr) throw new Error("Connection declined by user.");

                    setAddress(addr);
                    setWalletType('freighter');
                } else {
                    window.open("https://www.freighter.app/", "_blank");
                    throw new Error("Freighter not installed. Opening download page...");
                }
            } else if (selectedType === 'albedo') {
                const albedo = (window as any).albedo;
                if (albedo) {
                    const res = await albedo.publicKey();
                    setAddress(res.pubkey);
                    setWalletType('albedo');
                } else {
                    window.open("https://albedo.link/", "_blank");
                    throw new Error("Albedo not found. Opening albedo.link...");
                }
            } else if (selectedType === 'xbull') {
                const xbull = (window as any).xBullSDK;
                if (xbull) {
                    const res = await xbull.getPublicKey();
                    setAddress(res);
                    setWalletType('xbull');
                } else {
                    window.open("https://xbull.app/", "_blank");
                    throw new Error("xBull not found. Opening download page...");
                }
            } else if (selectedType === 'metamask') {
                const eth = (window as Record<string, any>).ethereum;
                if (!eth) {
                    window.open("https://metamask.io/", "_blank");
                    throw new Error("MetaMask extension not found.");
                }
                
                try {
                    // 1. Request to install the Stellar Snap in MetaMask
                    await eth.request({
                        method: 'wallet_requestSnaps',
                        params: { 'npm:@stellar/snap': {} } // Installs official Stellar Snap
                    });
                    
                    // 2. Fetch the Stellar address derived from the user's secret recovery phrase
                    const snapRes = await eth.request({
                        method: 'wallet_invokeSnap',
                        params: { 
                            snapId: 'npm:@stellar/snap', 
                            request: { method: 'getAddress' } 
                        }
                    });
                    
                    const addr = typeof snapRes === 'string' ? snapRes : (snapRes as any).address;
                    if (!addr) throw new Error("No address returned from Stellar Snap.");
                    
                    setAddress(addr);
                    setWalletType('metamask');
                } catch (snapErr: any) {
                    throw new Error("Stellar Snap integration failed: " + (snapErr.message || "Unknown error"));
                }
            } else if (selectedType === 'lobstr') {
                throw new Error("LOBSTR Vault currently connects via mobile app scanning only. Please use Freighter for desktop interactions.");
            }
        } catch (err: any) {
            setError(err.message || "Failed to connect wallet.");
            console.error("Wallet connection error:", err);
        } finally {
            setConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        setAddress(null);
        setWalletType(null);
        setError(null);
    }, []);

    const sign = useCallback(async (xdr: string, network: "TESTNET" | "PUBLIC") => {
        if (window.location.search.includes('demo=true')) {
            return new Promise(resolve => setTimeout(() => resolve('MOCK_SIGNED_XDR'), 1500));
        }

        if (!walletType) throw new Error("No wallet connected.");

        const passphrase = network === "TESTNET" 
            ? "Test SDF Network ; September 2015" 
            : "Public Global Stellar Network ; October 2015";

        switch (walletType) {
            case 'freighter':
                const signRes = await signFreighter(xdr, { networkPassphrase: passphrase }) as any;
                return signRes.signedTxXdr || signRes;
            case 'albedo':
                const albedo = (window as any).albedo;
                const res = await albedo.tx({ xdr, network: network.toLowerCase() });
                return res.signed_envelope;
            case 'xbull':
                const xbull = (window as any).xBullSDK;
                return await xbull.signTransaction(xdr, network);
            case 'metamask':
                const eth = (window as Record<string, any>).ethereum;
                try {
                    const snapSign = await eth.request({
                        method: 'wallet_invokeSnap',
                        params: {
                            snapId: 'npm:@stellar/snap',
                            request: {
                                method: 'signTransaction',
                                params: { transaction: xdr, networkPassphrase: passphrase }
                            }
                        }
                    });
                    return (snapSign as any).transaction || snapSign;
                } catch (err: any) {
                    throw new Error("MetaMask Snap failed to sign: " + err.message);
                }
            default:
                throw new Error("Unsupported wallet.");
        }
    }, [walletType]);

    useEffect(() => {
        const autoConnect = async () => {
            try {
                const connResult = await checkFreighter();
                const connected = typeof connResult === 'object' ? connResult.isConnected : connResult;
                if (connected) {
                    const addrResult = await getFreighterAddr();
                    const addr = typeof addrResult === 'object' ? addrResult.address : addrResult;
                    if (addr) {
                        setAddress(addr);
                        setWalletType('freighter');
                    }
                }
            } catch {
                // Ignore silent auto-connect errors
            }
        };
        autoConnect();
    }, []);

    return (
        <StellarContext.Provider value={{
            address,
            isConnected: !!address,
            connecting,
            error,
            walletType,
            connect,
            disconnect,
            sign
        }}>
            {children}
        </StellarContext.Provider>
    );
}

export function useStellar() {
    const context = useContext(StellarContext);
    if (context === undefined) {
        throw new Error('useStellar must be used within a StellarProvider');
    }
    return context;
}
