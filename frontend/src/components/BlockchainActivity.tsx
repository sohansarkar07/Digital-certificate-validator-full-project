"use client";
import React, { useEffect, useState } from "react";
import { dbGetTransactions, type TransactionEntry } from "@/lib/db";
import { 
  Activity, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Hash, 
  Globe2,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function BlockchainActivity() {
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      const data = await dbGetTransactions(200);
      setTransactions(data);
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const filteredTx = transactions.filter(t => filter === "all" || t.event_type.toLowerCase().includes(filter));

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Events</option>
            <option value="credential">Credentials</option>
            <option value="institution">Institutions</option>
            <option value="stake">Staking</option>
            <option value="dispute">Disputes</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Tx Hash</th>
                <th className="px-6 py-4 font-medium">Event Type</th>
                <th className="px-6 py-4 font-medium">Wallet / Role</th>
                <th className="px-6 py-4 font-medium">Network</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-500 dark:text-slate-400">Syncing with ledger...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No transactions found for this filter.
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx, idx) => (
                  <tr 
                    key={tx.id || idx} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-400" />
                        <span className="font-mono text-blue-600 dark:text-blue-400 font-medium tracking-tight">
                          {tx.hash.substring(0, 16)}...
                        </span>
                        {tx.explorer_link && (
                          <a 
                            href={tx.explorer_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="View on Explorer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {tx.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                          {tx.wallet_address.substring(0, 8)}...{tx.wallet_address.slice(-4)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-500">{tx.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Globe2 className="w-3.5 h-3.5" />
                        {tx.network}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {tx.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                      ) : tx.status === 'failed' ? (
                        <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500 mx-auto animate-pulse" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {tx.created_at ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true }) : 'Just now'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
