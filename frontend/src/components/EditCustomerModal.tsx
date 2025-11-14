import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { customersApi } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import type { Customer, CustomerFormData } from '../../../shared/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSaved: () => void;
}

export function EditCustomerModal({ open, onOpenChange, customer, onSaved }: Props) {
  const [form, setForm] = useState<{ name: string; email?: string; phone?: string; contactPerson?: string; address?: string; description?: string; }>({
    name: '',
    email: '',
    phone: '',
    contactPerson: '',
    address: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && customer) {
      setForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        contactPerson: customer.contactPerson || '',
        address: customer.address || '',
        description: customer.description || '',
      });
      setError(null);
    }
  }, [open, customer]);

  const mutation = useMutation({
    mutationFn: async (payload: Partial<CustomerFormData>) => customersApi.updateCustomer(customer!.id, payload),
    onSuccess: () => {
      setSubmitting(false);
      onSaved();
    },
    onError: (e: any) => {
      setSubmitting(false);
      setError(e?.message || 'Failed to update customer');
    },
  });

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setSubmitting(true);
    setError(null);

    const payload: Partial<CustomerFormData> = {
      name: form.name.trim(),
      email: form.email?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      contactPerson: form.contactPerson?.trim() || undefined,
      address: form.address?.trim() || undefined,
      description: form.description?.trim() || undefined,
    };

    // Do not allow editing balances here (currentBalance, receivable)
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-full p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
          <DialogTitle className="text-xl font-semibold">Edit Customer</DialogTitle>
          <DialogClose onClick={handleClose} />
        </DialogHeader>

        {!customer ? (
          <div className="px-6 py-6 text-muted-foreground">No customer selected.</div>
        ) : (
          <form onSubmit={onSubmit} className="px-6 py-6 space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input id="contactPerson" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            <div className="text-xs text-muted-foreground">Balance and receivable cannot be edited here.</div>

            <DialogFooter className="px-0 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
