import React, { useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency, formatDate } from '@/lib/helpers';
import type { PurchaseEntry, PurchaseItemEntry, PurchaseStatus } from '../../../../shared/types';

export default function InvoiceDetailModal({
  open,
  onOpenChange,
  invoice,
  items,
  onLoadItems,
  statusDraft,
  onChangeStatus,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  invoice: PurchaseEntry | null;
  items: PurchaseItemEntry[];
  onLoadItems: (invoiceId: number) => Promise<void>;
  statusDraft: PurchaseStatus | null;
  onChangeStatus: (s: PurchaseStatus | null) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}) {
  useEffect(() => {
    if (open && invoice) {
      onLoadItems(invoice.id);
    }
  }, [open, invoice, onLoadItems]);

  const total = useMemo(() => items.reduce((s, it) => s + Number(it.total || 0), 0), [items]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
          <DialogTitle className="text-xl font-semibold">Invoice Details</DialogTitle>
          <DialogClose onClick={() => onOpenChange(false)} />
        </DialogHeader>
        <div className="px-6 py-6 space-y-4 max-h-[75vh] overflow-auto">
          {invoice ? (
            <>
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
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="font-medium">{formatCurrency(invoice.totalAmount)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <select
                    className="border rounded h-10 px-3 bg-background capitalize"
                    value={statusDraft ?? ''}
                    onChange={(e) => onChangeStatus(e.target.value as any)}
                  >
                    <option value="paid">paid</option>
                    <option value="unpaid">unpaid</option>
                    <option value="partial">partial</option>
                  </select>
                </div>
                {statusDraft !== null && invoice.status !== statusDraft && (
                  <Button onClick={onSave} disabled={saving}>
                    {saving ? (<><Spinner className="mr-2 h-4 w-4" />Saving...</>) : 'Save Changes'}
                  </Button>
                )}
              </div>
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-2 md:p-3">Product</th>
                      <th className="text-right p-2 md:p-3">Qty</th>
                      <th className="text-right p-2 md:p-3">Unit Price</th>
                      <th className="text-right p-2 md:p-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2 md:p-3">{it.productName}</td>
                        <td className="p-2 md:p-3 text-right">{Number(it.quantity).toFixed(2)}</td>
                        <td className="p-2 md:p-3 text-right">{formatCurrency(it.unitPrice)}</td>
                        <td className="p-2 md:p-3 text-right">{formatCurrency(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="p-2 md:p-3 text-right font-semibold" colSpan={3}>Grand Total</td>
                      <td className="p-2 md:p-3 text-right font-semibold">{formatCurrency(total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <div className="py-6 text-muted-foreground">No invoice selected</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
