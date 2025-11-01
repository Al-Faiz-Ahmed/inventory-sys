import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Select, SelectOption } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { categoriesApi, inventoryApi } from '@/lib/api';
import type { Category, ProductFormData } from '@/lib/types';

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: (ProductFormData & { id: string }) | null;
  onUpdated?: () => void;
}

interface FormErrors {
  name?: string;
  sku?: string;
  category?: string;
  price?: string;
  cost?: string;
  quantity?: string;
  minQuantity?: string;
  maxQuantity?: string;
  _general?: string;
}

export function EditProductModal({ open, onOpenChange, product, onUpdated }: EditProductModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    sku: '',
    categoryId: '',
    price: 0,
    cost: 0,
    quantity: 0,
    minQuantity: 0,
    maxQuantity: 0,
    supplier: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Prefill when opening
  useEffect(() => {
    if (open && product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        categoryId: (product as any).categoryId || product.categoryId || '',
        price: Number(product.price) || 0,
        cost: Number(product.cost) || 0,
        quantity: Number(product.quantity) || 0,
        minQuantity: Number(product.minQuantity) || 0,
        maxQuantity: Number(product.maxQuantity) || 0,
        supplier: product.supplier || '',
      });
      setErrors({});
      setTouched({});
    }
  }, [open, product]);

  // Fetch product categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => categoriesApi.getCategories() as Promise<Category[]>,
    enabled: open,
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (data: ProductFormData) => inventoryApi.updateProduct((product as any)?.id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      if (onUpdated) onUpdated();
      handleClose();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
      setErrors({ _general: errorMessage });
    },
  });

  // Validate form (same as AddProductModal)
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    else if (formData.name.trim().length < 2) newErrors.name = 'Product name must be at least 2 characters';

    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    else if (formData.sku.trim().length < 2) newErrors.sku = 'SKU must be at least 2 characters';

    if (!formData.categoryId) newErrors.category = 'Product category is required';

    if (!formData.price || formData.price <= 0) newErrors.price = 'Price must be greater than 0';

    if (!formData.cost || formData.cost <= 0) newErrors.cost = 'Cost must be greater than 0';

    if (formData.cost > formData.price) newErrors.cost = 'Cost cannot be greater than price';

    if (formData.quantity < 0) newErrors.quantity = 'Quantity cannot be negative';

    if (formData.minQuantity < 0) newErrors.minQuantity = 'Minimum quantity cannot be negative';

    if (formData.maxQuantity < 0) newErrors.maxQuantity = 'Maximum quantity cannot be negative';

    if (formData.minQuantity > formData.maxQuantity && formData.maxQuantity > 0) {
      newErrors.maxQuantity = 'Maximum quantity must be greater than minimum quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value) || 0) : type === 'checkbox' ? checked : value,
    } as any));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev } as any;
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) updateProductMutation.mutate(formData as any);
  };

  const handleClose = () => {
    setErrors({});
    setTouched({});
    onOpenChange(false);
  };

  const formatNumberInput = (value: number | string): string => {
    if (value === '' || value === 0) return '';
    return value.toString();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0 scrollbar-hide">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-semibold">Edit Product</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground mt-1">
            Update the product details below.
          </DialogDescription>
          <DialogClose onClick={handleClose} />
        </DialogHeader>

        <div className="flex flex-col">
          <form id="product-edit-form" onSubmit={handleSubmit} className="px-6 py-6">
            {errors._general && (
              <div className="p-4 mb-6 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md" role="alert" aria-live="polite">
                {errors._general}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-foreground pb-2 border-b border-border">Basic Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Product Name <span className="text-destructive">*</span></Label>
                  <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} onBlur={() => handleBlur('name')} placeholder="Enter product name" aria-invalid={touched.name && !!errors.name} aria-describedby={touched.name && errors.name ? 'name-error' : undefined} required />
                  {touched.name && errors.name && <p id="name-error" className="text-sm text-destructive mt-1" role="alert">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Enter product description (optional)" rows={3} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (Stock Keeping Unit) <span className="text-destructive">*</span></Label>
                  <Input id="sku" name="sku" type="text" value={formData.sku} onChange={handleChange} onBlur={() => handleBlur('sku')} placeholder="e.g., PROD-001" aria-invalid={touched.sku && !!errors.sku} aria-describedby={touched.sku && errors.sku ? 'sku-error' : undefined} required />
                  {touched.sku && errors.sku && <p id="sku-error" className="text-sm text-destructive mt-1" role="alert">{errors.sku}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Product Category <span className="text-destructive">*</span></Label>
                  {categoriesLoading ? (
                    <div className="flex items-center justify-center py-6 border border-input rounded-md bg-muted/30">
                      <Spinner className="h-5 w-5" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading categories...</span>
                    </div>
                  ) : (
                    <>
                      <Select id="category" name="categoryId" value={formData.categoryId} onChange={handleChange} onBlur={() => handleBlur('category')} aria-invalid={touched.category && !!errors.category} aria-describedby={touched.category && errors.category ? 'category-error' : undefined} error={touched.category && !!errors.category} required>
                        <SelectOption value="">Select a category</SelectOption>
                        {categories.map((category) => (
                          <SelectOption key={category.id} value={category.id}>{category.name}</SelectOption>
                        ))}
                      </Select>
                      {touched.category && errors.category && (
                        <p id="category-error" className="text-sm text-destructive mt-1" role="alert">{errors.category}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-5 pt-2">
                <h3 className="text-lg font-semibold text-foreground pb-2 border-b border-border">Pricing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="price">Selling Price <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                      <Input id="price" name="price" type="number" step="0.01" min="0" value={formatNumberInput(formData.price)} onChange={handleChange} onBlur={() => handleBlur('price')} placeholder="0.00" className="pl-8" aria-invalid={touched.price && !!errors.price} aria-describedby={touched.price && errors.price ? 'price-error' : undefined} required />
                    </div>
                    {touched.price && errors.price && <p id="price-error" className="text-sm text-destructive mt-1" role="alert">{errors.price}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost Price <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                      <Input id="cost" name="cost" type="number" step="0.01" min="0" value={formatNumberInput(formData.cost)} onChange={handleChange} onBlur={() => handleBlur('cost')} placeholder="0.00" className="pl-8" aria-invalid={touched.cost && !!errors.cost} aria-describedby={touched.cost && errors.cost ? 'cost-error' : undefined} required />
                    </div>
                    {touched.cost && errors.cost && <p id="cost-error" className="text-sm text-destructive mt-1" role="alert">{errors.cost}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-5 pt-2">
                <h3 className="text-lg font-semibold text-foreground pb-2 border-b border-border">Stock Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Current Quantity</Label>
                    <Input id="quantity" name="quantity" type="number" min="0" value={formatNumberInput(formData.quantity)} onChange={handleChange} onBlur={() => handleBlur('quantity')} placeholder="0" aria-invalid={touched.quantity && !!errors.quantity} aria-describedby={touched.quantity && errors.quantity ? 'quantity-error' : undefined} />
                    {touched.quantity && errors.quantity && <p id="quantity-error" className="text-sm text-destructive mt-1" role="alert">{errors.quantity}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minQuantity">Min Quantity</Label>
                    <Input id="minQuantity" name="minQuantity" type="number" min="0" value={formatNumberInput(formData.minQuantity)} onChange={handleChange} onBlur={() => handleBlur('minQuantity')} placeholder="0" aria-invalid={touched.minQuantity && !!errors.minQuantity} aria-describedby={touched.minQuantity && errors.minQuantity ? 'minQuantity-error' : undefined} />
                    {touched.minQuantity && errors.minQuantity && <p id="minQuantity-error" className="text-sm text-destructive mt-1" role="alert">{errors.minQuantity}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxQuantity">Max Quantity</Label>
                    <Input id="maxQuantity" name="maxQuantity" type="number" min="0" value={formatNumberInput(formData.maxQuantity)} onChange={handleChange} onBlur={() => handleBlur('maxQuantity')} placeholder="0" aria-invalid={touched.maxQuantity && !!errors.maxQuantity} aria-describedby={touched.maxQuantity && errors.maxQuantity ? 'maxQuantity-error' : undefined} />
                    {touched.maxQuantity && errors.maxQuantity && <p id="maxQuantity-error" className="text-sm text-destructive mt-1" role="alert">{errors.maxQuantity}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-5 pt-2">
                <h3 className="text-lg font-semibold text-foreground pb-2 border-b border-border">Additional Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input id="supplier" name="supplier" type="text" value={formData.supplier} onChange={handleChange} placeholder="Enter supplier name (optional)" />
                </div>
              </div>
            </div>
          </form>

          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30 gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={updateProductMutation.isPending} className="min-w-[100px]">Cancel</Button>
            <Button type="submit" form="product-edit-form" disabled={updateProductMutation.isPending} className="min-w-[140px]">
              {updateProductMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
