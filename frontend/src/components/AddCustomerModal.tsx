import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { customersApi } from '@/lib/api';
import type { CustomerFormData } from '../../../shared/types';

interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  description?: string;
  _general?: string;
}

export function AddCustomerModal({ open, onOpenChange }: AddCustomerModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    contactPerson: '',
    address: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const createCustomerMutation = useMutation({
    mutationFn: (data: CustomerFormData) => customersApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleClose();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
      setErrors({ _general: errorMessage });
    },
  });

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true });
    if (!validate()) return;
    createCustomerMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', phone: '', contactPerson: '', address: '', description: '' });
    setErrors({});
    setTouched({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0 scrollbar-hide">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-semibold">Add New Customer</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground mt-1">
            Fill in the details below to add a new customer.
          </DialogDescription>
          <DialogClose onClick={handleClose} />
        </DialogHeader>

        <div className="flex flex-col">
          <form id="customer-form" onSubmit={handleSubmit} className="px-6 py-6">
            {errors._general && (
              <div className="p-4 mb-6 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md" role="alert" aria-live="polite">
                {errors._general}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} onBlur={() => handleBlur('name')} placeholder="Enter customer name" aria-invalid={touched.name && !!errors.name} aria-describedby={touched.name && errors.name ? 'name-error' : undefined} required />
                {touched.name && errors.name && (
                  <p id="name-error" className="text-sm text-destructive mt-1" role="alert">{errors.name}</p>
                )}
              </div>

              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-foreground pb-2 border-b border-border">Contact Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} onBlur={() => handleBlur('phone')} placeholder="Enter phone number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input id="contactPerson" name="contactPerson" type="text" value={formData.contactPerson} onChange={handleChange} onBlur={() => handleBlur('contactPerson')} placeholder="Enter contact person" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} onBlur={() => handleBlur('email')} placeholder="Enter email address" aria-invalid={touched.email && !!errors.email} aria-describedby={touched.email && errors.email ? 'email-error' : undefined} />
                  {touched.email && errors.email && (
                    <p id="email-error" className="text-sm text-destructive mt-1" role="alert">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" name="address" value={formData.address} onChange={handleChange} onBlur={() => handleBlur('address')} placeholder="Enter customer address" rows={3} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} onBlur={() => handleBlur('description')} placeholder="Additional details about the customer" rows={3} />
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button type="button" variant="outline" onClick={handleClose} disabled={createCustomerMutation.isPending}>Cancel</Button>
          <Button type="submit" form="customer-form" disabled={createCustomerMutation.isPending}>
            {createCustomerMutation.isPending ? (<><Spinner className="mr-2 h-4 w-4" />Creating...</>) : 'Create Customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
