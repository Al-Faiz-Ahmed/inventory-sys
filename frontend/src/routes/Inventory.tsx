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
import { formatCurrency } from '@/lib/helpers';
import { categoriesApi } from '@/lib/api';
import type { Category, Product } from '@/lib/types';

export function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState<Record<string, boolean>>({});
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products when a category is opened
  useEffect(() => {
    openCategories.forEach((categoryId) => {
      if (!categoryProducts[categoryId] && !loadingProducts[categoryId]) {
        fetchCategoryProducts(categoryId);
      }
    });
  }, [openCategories]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await categoriesApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoadingCategories(false);
    }
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await categoriesApi.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
      });
      setNewCategoryName('');
      setNewCategoryDescription('');
      setIsAddCategoryDialogOpen(false);
      await fetchCategories();
    } catch (error: any) {
      console.error('Failed to create category:', error);
      alert(error.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
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
          <Button onClick={() => setIsAddCategoryDialogOpen(true)}>
            Add Category
          </Button>
          <Button>Add Product</Button>
        </div>
      </div>

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
          {loadingCategories ? (
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
                                        <Button variant="outline" size="sm">Edit</Button>
                                        <Button variant="destructive" size="sm">Delete</Button>
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
          )}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new product category to organize your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                placeholder="e.g., Electronics, Accessories"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={isSubmitting}
              />
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
          <DialogFooter>
            <DialogClose onClick={() => {
              setNewCategoryName('');
              setNewCategoryDescription('');
            }}>
              Cancel
            </DialogClose>
            <Button onClick={handleAddCategory} disabled={isSubmitting || !newCategoryName.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
