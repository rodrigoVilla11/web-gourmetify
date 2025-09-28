"use client";
import React, { useState } from "react";
import {
  useListTransfersQuery,
  useCreateTransferMutation,
} from "@/redux/services/transfersApi";

export default function TransfersPage() {
  const [range, setRange] = useState({
    from: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
    to: new Date().toISOString(),
  });
  const { data: transfers, isLoading, refetch } = useListTransfersQuery(range);
  const [createTransfer, { isLoading: saving }] = useCreateTransferMutation();

  const [fromAccountId, setFrom] = useState("");
  const [toAccountId, setTo] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDesc] = useState("");

  const submit = async () => {
    if (!fromAccountId || !toAccountId || amount <= 0) return;
    await createTransfer({
      data: {
        fromAccountId,
        toAccountId,
        amount,
        date: new Date().toISOString(),
        description: description || null,
        userId: "USER_ID",
      },
    }).unwrap();
    setAmount(0); setDesc("");
    refetch();
  };

  return (
    <main className="p-6 space-y-4">
      <section className="border rounded p-3 grid sm:grid-cols-5 gap-2">
        <input className="border rounded px-2 py-1" placeholder="fromAccountId" value={fromAccountId} onChange={e=>setFrom(e.target.value)} />
        <input className="border rounded px-2 py-1" placeholder="toAccountId" value={toAccountId} onChange={e=>setTo(e.target.value)} />
        <input className="border rounded px-2 py-1" type="number" step="0.01" placeholder="Monto" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
        <input className="border rounded px-2 py-1" placeholder="Descripción (opcional)" value={description} onChange={e=>setDesc(e.target.value)} />
        <button className="border rounded px-3 py-1 disabled:opacity-50" onClick={submit} disabled={saving || !fromAccountId || !toAccountId || amount <= 0}>
          {saving ? "Transferiendo…" : "Transferir"}
        </button>
      </section>

      <section className="border rounded p-3">
        <h2 className="font-medium mb-2">Transfers</h2>
        {isLoading ? (
          <div>Cargando…</div>
        ) : (
          <ul className="space-y-2">
            {transfers?.map(t => (
              <li key={t.id} className="border rounded p-2 text-sm flex justify-between">
                <span>#{t.id.slice(0,6)} · {t.fromAccountId} → {t.toAccountId}</span>
                <span>{t.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
