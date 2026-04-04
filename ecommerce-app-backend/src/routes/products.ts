import { Router, Request, Response } from 'express';
import { ProductModel, CreateProductData, UpdateProductData, ProductFilters } from '../models/Product';
import { validateRequest, productSchema } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
const productModel = new ProductModel();

// Get all products with filtering and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters: ProductFilters = {
      category: req.query.category as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      search: req.query.search as string,
      isActive: req.query.isActive !== 'false', // Default to true unless explicitly false
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const result = await productModel.getProducts(filters);
    
    res.json({
      products: result.products,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total: result.total,
        pages: Math.ceil(result.total / (filters.limit || 10))
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product categories
router.get('/categories/list', async (req: Request, res: Response) => {
  try {
    const categories = await productModel.getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await productModel.getProductById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new product (Admin only)
router.post('/', authenticateToken, requireAdmin, validateRequest(productSchema), async (req: Request, res: Response) => {
  try {
    const productData: CreateProductData = req.body;
    const product = await productModel.createProduct(productData);
    
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const updateData: UpdateProductData = req.body;
    const product = await productModel.updateProduct(id, updateData);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const success = await productModel.deleteProduct(id);
    if (!success) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
