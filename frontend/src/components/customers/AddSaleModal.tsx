import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { salesApi, inventoryApi } from '@/lib/api';
import type { SaleEntryFormData } from '../../../../shared/types';
import type { Product } from '@/lib/types';

function getTodayLocalISODate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateInvoiceId() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randLetters = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const randNums = String(Math.floor(100 + Math.random() * 900));
  return `INVO-${randNums}${randLetters}`;
}

export default function AddSaleModal({ open, onOpenChange, customerId, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; customerId: number; onCreated: () => void; }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{ invoiceNumber: string; date: string; description: string; }>({
    invoiceNumber: '',
    date: getTodayLocalISODate(),
    description: '',
  });
  const [items, setItems] = useState<Array<{
    id: string;
    productId: string | null;
    productName: string;
    quantity: string;
    unitPrice: string;
    productStock?: number | null;
    productPrice?: number | null;
  }>>([
    { id: crypto.randomUUID(), productId: null, productName: '', quantity: '', unitPrice: '', productStock: null, productPrice: null },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingProducts(true);
        const list = await inventoryApi.getProducts();
        if (mounted) setAllProducts(list);
      } catch {
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const productOptions = useMemo(() => allProducts.map(p => ({ id: p.id, name: p.name, sku: p.sku })), [allProducts]);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: SaleEntryFormData) => salesApi.createSale(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', { customerId }] });
    },
    onError: (e: any) => setError(e?.message || 'Failed to create sale'),
    onSettled: () => setSubmitting(false),
  });

  const handleClose = () => {
    setForm({ invoiceNumber: '', date: getTodayLocalISODate(), description: '' });
    setItems([{ id: crypto.randomUUID(), productId: null, productName: '', quantity: '', unitPrice: '' }]);
    setError(null);
    onOpenChange(false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validate each row has a valid product and quantity within stock
    for (const it of items) {
      if (!it.productId) {
        setSubmitting(false);
        setError('Please select a valid product for each item.');
        return;
      }
      const qty = Number(it.quantity || 0);
      if (!Number.isFinite(qty) || qty <= 0) {
        setSubmitting(false);
        setError('Quantity must be greater than 0.');
        return;
      }
      const prod = allProducts.find(p => p.id === it.productId);
      if (!prod) {
        setSubmitting(false);
        setError('Selected product not found.');
        return;
      }
      if (qty > Number(prod.quantity)) {
        setSubmitting(false);
        setError(`Quantity for ${prod.name} cannot exceed available stock (${prod.quantity}).`);
        return;
      }
    }

    const cleanItems = items
      .map(it => ({
        productId: it.productId ?? null,
        quantity: Number(it.quantity || 0),
        unitPrice: Number(it.unitPrice || 0),
      }))
      .filter(it => it.productId && it.quantity > 0) as Array<{ productId: string; quantity: number; unitPrice: number }>;

    if (cleanItems.length !== items.filter(i => Number(i.quantity || 0) > 0).length) {
      setSubmitting(false);
      setError('Please select a valid product for each item.');
      return;
    }

    const total = cleanItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

    const payload: SaleEntryFormData = {
      customerId,
      invoiceNumber: form.invoiceNumber.trim(),
      date: form.date,
      totalAmount: Number(total.toFixed(2)),
      paidAmount: 0,
      status: 'unpaid',
      description: form.description.trim() ? form.description.trim() : undefined,
    };

    mutation.mutate(payload, {
      onSuccess: async (created: any) => {
        try {
          if (cleanItems.length > 0) {
            await Promise.all(
              cleanItems.map(it =>
                salesApi.createSaleItem(created.id, {
                  productId: it.productId,
                  quantity: it.quantity,
                  unitPrice: it.unitPrice,
                })
              )
            );
          }
          queryClient.invalidateQueries({ queryKey: ['sales', { customerId }] });
          onCreated();
        } catch (e: any) {
          setError(e?.message || 'Failed to create sale items');
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
          <DialogTitle className="text-xl font-semibold">Add Sale</DialogTitle>
          <DialogClose onClick={handleClose} />
        </DialogHeader>

        <div className="max-h-[75vh] overflow-auto">
          <form onSubmit={onSubmit} className="px-6 py-6 space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-12 md:grid-cols-10 gap-4 items-end">
              <div className="col-span-12 md:col-span-7 space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <div className="relative">
                  <Input id="invoiceNumber" value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} required className="pr-24" />
                  <Button type="button" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2" variant="outline" onClick={() => setForm((f) => ({ ...f, invoiceNumber: generateInvoiceId() }))} title="Generate invoice number">Generate</Button>
                </div>
              </div>
              <div className="col-span-12 md:col-span-3 space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Items</div>
              <div className="max-h-80 overflow-y-auto pr-2">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr>
                      <th className="w-8 p-2"></th>
                      <th className="text-left p-2">Product</th>
                      <th className="text-right p-2">Qty</th>
                      <th className="text-right p-2">Unit Price</th>
                      <th className="text-right p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id} className="align-middle">
                        <td className="p-2">
                          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setItems(prev => prev.length > 1 ? prev.filter(p => p.id !== it.id) : prev)} aria-label="Remove item" title="Remove">×</Button>
                        </td>
                        <td className="p-2">
                          <div className="space-y-1 relative">
                            <Input
                              value={it.productName}
                              onFocus={() => setFocusedItemId(it.id)}
                              onBlur={() => setTimeout(() => setFocusedItemId(cur => (cur === it.id ? null : cur)), 120)}
                              onChange={(e) => {
                                const v = e.target.value;
                                setItems(prev => prev.map(p => p.id === it.id ? { ...p, productName: v, productId: null, productStock: null, productPrice: null, quantity: '', unitPrice: '' } : p));
                              }}
                              placeholder={loadingProducts ? 'Loading products...' : 'Type name or SKU'}
                            />
                            {focusedItemId === it.id && it.productName.trim().length >= 1 && (
                              <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border border-input bg-popover shadow-md">
                                {productOptions
                                  .filter(opt => {
                                    const q = it.productName.trim().toLowerCase();
                                    return opt.name.toLowerCase().includes(q) || opt.sku.toLowerCase().includes(q);
                                  })
                                  .slice(0, 50)
                                  .map(opt => (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        const prod = allProducts.find(p => p.id === opt.id);
                                        const defaultQty = prod ? String(prod.quantity ?? '') : '';
                                        const defaultPrice = prod ? String(prod.price ?? '') : '';
                                        setItems(prev => prev.map(p => p.id === it.id ? { ...p, productName: opt.name, productId: opt.id, productStock: prod?.quantity ?? null, productPrice: prod?.price ?? null, quantity: defaultQty, unitPrice: defaultPrice } : p));
                                        setFocusedItemId(null);
                                      }}
                                    >
                                      <span className="truncate">{opt.name}</span>
                                      <span className="ml-2 text-xs text-muted-foreground">{opt.sku}</span>
                                    </button>
                                  ))}
                                {productOptions.filter(opt => {
                                  const q = it.productName.trim().toLowerCase();
                                  return opt.name.toLowerCase().includes(q) || opt.sku.toLowerCase().includes(q);
                                }).length === 0 && (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">No products found</div>
                                )}
                              </div>
                            )}
                            {it.productName && !it.productId && (
                              <div className="text-xs text-destructive">Select a product from the list or create it in Inventory.</div>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <Input
                            className="text-right"
                            type="number"
                            step="0.001"
                            min={0}
                            max={it.productStock ?? undefined}
                            placeholder={it.productStock != null ? `Max ${it.productStock}` : undefined}
                            value={it.quantity}
                            onChange={(e) => {
                              const v = e.target.value;
                              setItems(prev => prev.map(p => {
                                if (p.id !== it.id) return p;
                                let q = v;
                                const n = Number(q);
                                if (p.productStock != null && Number.isFinite(n) && n > p.productStock) {
                                  q = String(p.productStock);
                                }
                                return { ...p, quantity: q };
                              }));
                            }}
                          />
                        </td>
                        <td className="p-2 text-right">
                          <Input
                            className="text-right"
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder={it.productPrice != null ? `${it.productPrice}` : undefined}
                            value={it.unitPrice}
                            onChange={(e) => { const v = e.target.value; setItems(prev => prev.map(p => p.id === it.id ? { ...p, unitPrice: v } : p)); }}
                          />
                        </td>
                        <td className="p-2 text-right">{(() => { const q = Number(it.quantity || 0); const u = Number(it.unitPrice || 0); return (q * u).toFixed(2); })()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center">
                <Button type="button" onClick={() => setItems(prev => [...prev, { id: crypto.randomUUID(), productId: null, productName: '', quantity: '', unitPrice: '' }])}>Add Item</Button>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Invoice Total</div>
                  <div className="text-lg font-semibold">{items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <DialogFooter className="px-0 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? (<><Spinner className="mr-2 h-4 w-4" />Saving...</>) : 'Save'}</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
