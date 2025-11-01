import React, { useEffect, useState } from 'react';
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
import { suppliersApi } from '@/lib/api';
import type { Supplier, SupplierFormData } from '../../../shared/types';

interface EditSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onUpdated?: () => void;
}

interface FormErrors {
  name?: string;
  contactNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  bankAccNo?: string;
  bankAccName?: string;
  _general?: string;
}

export function EditSupplierModal({ open, onOpenChange, supplier, onUpdated }: EditSupplierModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contactNumber: '',
    phone: '',
    email: '',
    address: '',
    bankAccNo: '',
    bankAccName: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Prefill when opening
  useEffect(() => {
    if (open && supplier) {
      setFormData({
        name: supplier.name || '',
        contactNumber: supplier.contactNumber || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        bankAccNo: supplier.bankAccNo || '',
        bankAccName: supplier.bankAccName || '',
      });
      setErrors({});
      setTouched({});
    }
  }, [open, supplier]);

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: (data: SupplierFormData) => {
      if (!supplier) throw new Error('Supplier is required');
      return suppliersApi.updateSupplier(supplier.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      if (onUpdated) onUpdated();
      handleClose();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update supplier';
      setErrors({ _general: errorMessage });
    },
  });

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Validate email format if provided
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
    
    // Clear error when user starts typing
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
    
    // Mark all required fields as touched
    setTouched({
      name: true,
      contactNumber: true,
      phone: true,
      email: true,
      address: true,
      bankAccNo: true,
      bankAccName: true,
    });

    if (!validate()) {
      return;
    }

    updateSupplierMutation.mutate(formData);
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      name: '',
      contactNumber: '',
      phone: '',
      email: '',
      address: '',
      bankAccNo: '',
      bankAccName: '',
    });
    setErrors({});
    setTouched({});
    onOpenChange(false);
  };

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0 scrollbar-hide">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-semibold">Edit Supplier</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground mt-1">
            Update the supplier information below.
          </DialogDescription>
          <DialogClose onClick={handleClose} />
        </DialogHeader>

        <div className="flex flex-col">
          <form id="edit-supplier-form" onSubmit={handleSubmit} className="px-6 py-6">
            {errors._general && (
              <div
                className="p-4 mb-6 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                role="alert"
                aria-live="polite"
              >
                {errors._general}
              </div>
            )}

            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur('name')}
                  placeholder="Enter supplier name"
                  aria-invalid={touched.name && !!errors.name}
                  aria-describedby={touched.name && errors.name ? 'edit-name-error' : undefined}
                  required
                />
                {touched.name && errors.name && (
                  <p id="edit-name-error" className="text-sm text-destructive mt-1" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Contact Information Section */}
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-foreground pb-2 border-b border-border">
                  Contact Information
                </h3>

                {/* Contact Number */}
                <div className="space-y-2">
                  <Label htmlFor="edit-contactNumber">Contact Number</Label>
                  <Input
                    id="edit-contactNumber"
                    name="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    onBlur={() => handleBlur('contactNumber')}
                    placeholder="Enter contact number"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={() => handleBlur('phone')}
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    placeholder="Enter email address"
                    aria-invalid={touched.email && !!errors.email}
                    aria-describedby={touched.email && errors.email ? 'edit-email-error' : undefined}
                  />
                  {touched.email && errors.email && (
                    <p id="edit-email-error" className="text-sm text-destructive mt-1" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Textarea
                    id="edit-address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    onBlur={() => handleBlur('address')}
                    placeholder="Enter supplier address"
                    rows={3}
                  />
                </div>
              </div>

              {/* Bank Information Section */}
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-foreground pb-2 border-b border-border">
                  Bank Information
                </h3>

                {/* Bank Account Number */}
                <div className="space-y-2">
                  <Label htmlFor="edit-bankAccNo">Bank Account Number</Label>
                  <Input
                    id="edit-bankAccNo"
                    name="bankAccNo"
                    type="text"
                    value={formData.bankAccNo}
                    onChange={handleChange}
                    onBlur={() => handleBlur('bankAccNo')}
                    placeholder="Enter bank account number"
                  />
                </div>

                {/* Bank Account Name */}
                <div className="space-y-2">
                  <Label htmlFor="edit-bankAccName">Bank Account Name</Label>
                  <Input
                    id="edit-bankAccName"
                    name="bankAccName"
                    type="text"
                    value={formData.bankAccName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('bankAccName')}
                    placeholder="Enter bank account name"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={updateSupplierMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-supplier-form"
            disabled={updateSupplierMutation.isPending}
          >
            {updateSupplierMutation.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Updating...
              </>
            ) : (
              'Update Supplier'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

