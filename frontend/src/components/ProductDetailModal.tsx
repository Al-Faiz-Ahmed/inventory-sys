import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/helpers';
import type { Product } from '@/lib/types';

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ProductDetailModal({ open, onOpenChange, product }: ProductDetailModalProps) {
  const totalStockValue = React.useMemo(() => {
    if (!product) return 0;
    const qty = Number((product as any).quantity) || 0;
    const price = Number((product as any).price) || 0;
    return qty * price;
  }, [product]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-semibold">Product Details</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground mt-1">
            Review details for this product.
          </DialogDescription>
          <DialogClose onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {product ? (
            <>
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground pb-2 border-b border-border">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <div className="mt-1 font-medium">{product.name}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">SKU</Label>
                    <div className="mt-1 font-medium">{product.sku}</div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <div className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{product.description || '-'}</div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground pb-2 border-b border-border">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <Label className="text-muted-foreground">Selling Price</Label>
                    <div className="mt-1 font-medium">{formatCurrency(Number((product as any).price) || 0)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cost Price</Label>
                    <div className="mt-1 font-medium">{formatCurrency(Number((product as any).cost) || 0)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Average Price</Label>
                    <div className="mt-1 font-medium">{formatCurrency(Number((product as any).avgPrice) || 0)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <Label className="text-muted-foreground">Previous Selling Price</Label>
                    <div className="mt-1 text-sm">{formatCurrency(Number((product as any).previousPrice) || 0)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Previous Cost Price</Label>
                    <div className="mt-1 text-sm">{formatCurrency(Number((product as any).previousCost) || 0)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Previous Avg Price</Label>
                    <div className="mt-1 text-sm">{formatCurrency(Number((product as any).previousAvgPrice) || 0)}</div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground pb-2 border-b border-border">Stock</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div>
                    <Label className="text-muted-foreground">Quantity</Label>
                    <div className="mt-1 font-medium">{Number((product as any).quantity) || 0}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Min Quantity</Label>
                    <div className="mt-1">{product.minQuantity}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Max Quantity</Label>
                    <div className="mt-1">{product.maxQuantity}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Stock Value</Label>
                    <div className="mt-1 font-semibold">{formatCurrency(totalStockValue)}</div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="text-muted-foreground">No product selected.</div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30 gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="min-w-[100px]">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
