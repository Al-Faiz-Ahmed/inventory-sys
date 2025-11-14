import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SaleEntry, SaleItemEntry, SaleStatus } from '../../../../shared/types';
import { formatCurrency, formatDate } from '@/lib/helpers';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: SaleEntry | null;
  items: SaleItemEntry[];
  onLoadItems: (invoiceId: number) => Promise<void>;
  statusDraft: SaleStatus | null;
  onChangeStatus: (status: SaleStatus | null) => void;
  onSave: () => Promise<void>;
  saving?: boolean;
}

export default function SalesInvoiceDetailModal({ open, onOpenChange, invoice, items, onLoadItems, statusDraft, onChangeStatus, onSave, saving }: Props) {
  useEffect(() => {
    if (open && invoice) {
      onLoadItems(invoice.id);
    }
  }, [open, invoice, onLoadItems]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
          <DialogTitle className="text-xl font-semibold">Invoice Details</DialogTitle>
          <DialogClose onClick={() => onOpenChange(false)} />
        </DialogHeader>
        {!invoice ? (
          <div className="px-6 py-6 text-muted-foreground">No invoice selected.</div>
        ) : (
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Invoice #</div>
                <div className="font-medium">{invoice.invoiceNumber}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Date</div>
                <div>{formatDate(invoice.date)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
                <div className="font-semibold">{formatCurrency(Number(invoice.totalAmount))}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <select
                  className="w-full border rounded h-10 px-3 bg-background"
                  value={statusDraft ?? invoice.status}
                  onChange={(e) => onChangeStatus(e.target.value as any)}
                >
                  <option value="unpaid">unpaid</option>
                  <option value="partial">partial</option>
                  <option value="paid">paid</option>
                </select>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Items</div>
              <div className="overflow-auto max-h-80">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Product</th>
                      <th className="text-right p-2">Qty</th>
                      <th className="text-right p-2">Unit Price</th>
                      <th className="text-right p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2">{it.productName}</td>
                        <td className="p-2 text-right">{Number(it.quantity)}</td>
                        <td className="p-2 text-right">{formatCurrency(Number(it.unitPrice))}</td>
                        <td className="p-2 text-right font-medium">{formatCurrency(Number(it.total))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <DialogFooter className="px-0 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Close</Button>
              <Button type="button" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
