import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { AddProductModal } from '@/components/AddProductModal';
import { EditProductModal } from '@/components/EditProductModal';
import { formatCurrency } from '@/lib/helpers';
import { categoriesApi, inventoryApi } from '@/lib/api';
import type { Category, Product } from '@/lib/types';

const CATEGORIES_STORAGE_KEY = 'inventory_categories';

// Helper functions for localStorage
const loadCategoriesFromStorage = (): Category[] => {
  try {
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load categories from localStorage:', error);
  }
  return [];
};

const saveCategoriesToStorage = (categories: Category[]) => {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Failed to save categories to localStorage:', error);
  }
};

export function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>(() => loadCategoriesFromStorage());
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({});
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState<Record<string, boolean>>({});
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoriesFetched, setCategoriesFetched] = useState(() => loadCategoriesFromStorage().length > 0);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryErrors, setCategoryErrors] = useState<{ name?: string; _general?: string }>({});
  const [categoryTouched, setCategoryTouched] = useState<Record<string, boolean>>({});

  // Fetch products when a category is opened
  useEffect(() => {
    openCategories.forEach((categoryId) => {
      if (!categoryProducts[categoryId] && !loadingProducts[categoryId]) {
        fetchCategoryProducts(categoryId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCategories]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await categoriesApi.getCategories();
      setCategories(data);
      saveCategoriesToStorage(data);
      setCategoriesFetched(true);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const openEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditProductModalOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await inventoryApi.deleteProduct(productToDelete.id);
      // Optimistically remove from state
      const categoryId = (productToDelete as any).categoryId || (productToDelete.category as any);
      setCategoryProducts((prev) => {
        const newMap = { ...prev };
        if (categoryId && newMap[categoryId]) {
          newMap[categoryId] = newMap[categoryId].filter(p => p.id !== productToDelete.id);
        } else {
          // Fallback: scan all categories and remove
          Object.keys(newMap).forEach(cid => {
            newMap[cid] = newMap[cid].filter(p => p.id !== productToDelete.id);
          });
        }
        return newMap;
      });
      // Refresh the products for the category
      if (categoryId && openCategories.includes(categoryId)) {
        await fetchCategoryProducts(categoryId);
      }
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = async () => {
    await fetchCategories();
    // Clear cached products to force refresh when categories are re-opened
    setCategoryProducts({});
    setOpenCategories([]);
  };

  const fetchCategoryProducts = async (categoryId: string) => {
    try {
      setLoadingProducts((prev) => ({ ...prev, [categoryId]: true }));
      const products = await categoriesApi.getCategoryProducts(categoryId);
      setCategoryProducts((prev) => ({ ...prev, [categoryId]: products }));
    } catch (error) {
      console.error(`Failed to fetch products for category ${categoryId}:`, error);
    } finally {
      setLoadingProducts((prev) => ({ ...prev, [categoryId]: false }));
    }
  };

  const validateCategory = (): boolean => {
    const errs: { name?: string } = {};
    if (!newCategoryName.trim()) {
      errs.name = 'Category name is required';
    } else if (newCategoryName.trim().length < 2) {
      errs.name = 'Category name must be at least 2 characters';
    }
    setCategoryErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCategoryBlur = (field: string) => {
    setCategoryTouched((prev) => ({ ...prev, [field]: true }));
    validateCategory();
  };

  const handleCloseAddCategory = () => {
    setNewCategoryName('');
    setNewCategoryDescription('');
    setCategoryErrors({});
    setCategoryTouched({});
    setIsAddCategoryDialogOpen(false);
  };

  const handleAddCategory = async () => {
    if (!validateCategory()) return;
    try {
      setIsSubmitting(true);
      await categoriesApi.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
      });
      handleCloseAddCategory();
      await fetchCategories();
    } catch (error: any) {
      console.error('Failed to create category:', error);
      setCategoryErrors({ _general: error?.message || 'Failed to create category' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAddCategory();
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity <= product.minQuantity) return 'low';
    if (product.quantity >= product.maxQuantity) return 'high';
    return 'normal';
  };

  const getStockBadgeVariant = (status: string) => {
    switch (status) {
      case 'low': return 'destructive';
      case 'high': return 'secondary';
      default: return 'default';
    }
  };

  const filteredProductsForCategory = (categoryId: string) => {
    const products = categoryProducts[categoryId] || [];
    if (!searchTerm) return products;
    
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your products and stock levels by category
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={loadingCategories}
          >
            {loadingCategories ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </Button>
          <Button onClick={() => setIsAddCategoryDialogOpen(true)}>
            Add Category
          </Button>
          <Button onClick={() => setIsAddProductModalOpen(true)}>Add Product</Button>
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        open={isAddProductModalOpen}
        onOpenChange={setIsAddProductModalOpen}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        open={isEditProductModalOpen}
        onOpenChange={setIsEditProductModalOpen}
        product={selectedProduct ? ({
          id: selectedProduct.id,
          name: selectedProduct.name,
          description: selectedProduct.description,
          sku: selectedProduct.sku,
          categoryId: (selectedProduct as any).categoryId || (selectedProduct as any).category || '',
          price: Number((selectedProduct as any).price),
          cost: Number((selectedProduct as any).cost),
          quantity: Number((selectedProduct as any).quantity),
          minQuantity: Number((selectedProduct as any).minQuantity),
          maxQuantity: Number((selectedProduct as any).maxQuantity),
          supplier: selectedProduct.supplier,
        }) : null}
        onUpdated={() => {
          // After update, refresh products in opened categories
          if (selectedProduct) {
            const cid = (selectedProduct as any).categoryId || (selectedProduct as any).category;
            if (cid) fetchCategoryProducts(cid);
          }
        }}
      />

      {/* Search Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Categories Accordion */}
      <Card>
        <CardHeader>
          <CardTitle>Categories ({categories.length})</CardTitle>
          <CardDescription>
            Click on a category to view its products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!categoriesFetched ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">Categories not loaded yet.</p>
              <Button onClick={handleRefresh} disabled={loadingCategories}>
                {loadingCategories ? 'Loading...' : 'Load Categories'}
              </Button>
            </div>
          ) : loadingCategories ? (
            <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No categories found. Click "Add Category" to create one.
            </div>
          ) : (
            <Accordion
              type="multiple"
              value={openCategories}
              onValueChange={setOpenCategories}
            >
              {categories.map((category) => {
                const products = filteredProductsForCategory(category.id);
                const isLoading = loadingProducts[category.id];

                return (
                  <AccordionItem key={category.id} value={category.id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{category.name}</span>
                        {category.description && (
                          <span className="text-sm text-muted-foreground">
                            - {category.description}
                          </span>
                        )}
                        <Badge variant="secondary">
                          {isLoading ? '...' : categoryProducts[category.id]?.length || 0} products
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {isLoading ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Loading products...
                        </div>
                      ) : products.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          {searchTerm ? 'No products match your search.' : 'No products in this category.'}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-4">Product</th>
                                <th className="text-left p-4">SKU</th>
                                <th className="text-left p-4">Price</th>
                                <th className="text-left p-4">Cost</th>
                                <th className="text-left p-4">Stock</th>
                                <th className="text-left p-4">Status</th>
                                <th className="text-left p-4">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {products.map((product) => {
                                const stockStatus = getStockStatus(product);
                                return (
                                  <tr key={product.id} className="border-b">
                                    <td className="p-4">
                                      <div>
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {product.description}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-4 font-mono text-sm">{product.sku}</td>
                                    <td className="p-4">{formatCurrency(product.price)}</td>
                                    <td className="p-4">{formatCurrency(product.cost)}</td>
                                    <td className="p-4">
                                      <div className="text-sm">
                                        <div>{product.quantity} units</div>
                                        <div className="text-muted-foreground">
                                          Min: {product.minQuantity} | Max: {product.maxQuantity}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <Badge variant={getStockBadgeVariant(stockStatus)}>
                                        {stockStatus === 'low' ? 'Low Stock' :
                                         stockStatus === 'high' ? 'High Stock' : 'Normal'}
                                      </Badge>
                                    </td>
                                    <td className="p-4">
                                      <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => openEditProduct(product)}>Edit</Button>
                                        <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(product)}>Delete</Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )
        }
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog
        open={isAddCategoryDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseAddCategory();
          } else {
            setIsAddCategoryDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0 scrollbar-hide">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-2xl font-semibold">Add New Category</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground mt-1">
              Create a new product category to organize your inventory.
            </DialogDescription>
            <DialogClose onClick={handleCloseAddCategory} />
          </DialogHeader>

          <form id="category-form" onSubmit={onSubmitAddCategory} className="px-6 py-6">
            {categoryErrors._general && (
              <div
                className="p-4 mb-6 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                role="alert"
                aria-live="polite"
              >
                {categoryErrors._general}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-foreground pb-2 border-b border-border">
                  Basic Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="category-name">
                    Category Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="category-name"
                    placeholder="e.g., Electronics, Accessories"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onBlur={() => handleCategoryBlur('name')}
                    aria-invalid={categoryTouched.name && !!categoryErrors.name}
                    aria-describedby={categoryTouched.name && categoryErrors.name ? 'category-name-error' : undefined}
                    disabled={isSubmitting}
                    required
                  />
                  {categoryTouched.name && categoryErrors.name && (
                    <p id="category-name-error" className="text-sm text-destructive mt-1" role="alert">
                      {categoryErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category-description">Description</Label>
                  <Input
                    id="category-description"
                    placeholder="Optional description for this category"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </form>

          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseAddCategory}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="category-form"
              disabled={isSubmitting}
              className="min-w-[140px]"
            >
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-xl font-semibold">Delete Product</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground mt-1">
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
            <DialogClose onClick={() => setIsDeleteDialogOpen(false)} />
          </DialogHeader>
          <div className="px-6 py-6">
            <p className="text-sm">
              Product: <span className="font-medium">{productToDelete?.name}</span>
            </p>
            <p className="text-sm text-muted-foreground">SKU: {productToDelete?.sku}</p>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30 gap-3">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting} className="min-w-[100px]">Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteProduct} disabled={isDeleting} className="min-w-[140px]">{isDeleting ? 'Deleting...' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
