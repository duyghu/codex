import Database from '../config/database';

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  productName: string;
  productImageUrl: string;
}

export interface Order {
  id: number;
  userId: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  shippingAddress: string;
  billingAddress: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}

export interface CreateOrderData {
  userId: number;
  items: {
    productId: number;
    quantity: number;
    price: number;
  }[];
  shippingAddress: string;
  billingAddress: string;
  paymentMethod: string;
}

export interface UpdateOrderData {
  status?: Order['status'];
  paymentStatus?: Order['paymentStatus'];
  shippingAddress?: string;
  billingAddress?: string;
}

export class OrderModel {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async createOrder(orderData: CreateOrderData): Promise<Order> {
    const transaction = this.db.getPool().transaction();
    
    try {
      await transaction.begin();

      // Calculate total amount
      const totalAmount = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create order
      const orderQuery = `
        INSERT INTO Orders (userId, status, totalAmount, shippingAddress, billingAddress, paymentMethod, paymentStatus, createdAt, updatedAt)
        OUTPUT INSERTED.*
        VALUES (@userId, @status, @totalAmount, @shippingAddress, @billingAddress, @paymentMethod, @paymentStatus, GETDATE(), GETDATE())
      `;

      const orderRequest = transaction.request();
      orderRequest.input('userId', orderData.userId);
      orderRequest.input('status', 'pending');
      orderRequest.input('totalAmount', totalAmount);
      orderRequest.input('shippingAddress', orderData.shippingAddress);
      orderRequest.input('billingAddress', orderData.billingAddress);
      orderRequest.input('paymentMethod', orderData.paymentMethod);
      orderRequest.input('paymentStatus', 'pending');

      const orderResult = await orderRequest.query(orderQuery);
      const order = orderResult.recordset[0];

      // Create order items
      for (const item of orderData.items) {
        const itemQuery = `
          INSERT INTO OrderItems (orderId, productId, quantity, price, productName, productImageUrl)
          VALUES (@orderId, @productId, @quantity, @price, @productName, @productImageUrl)
        `;

        // Get product details
        const productQuery = 'SELECT name, imageUrl, stock, isActive FROM Products WHERE id = @productId';
        const productRequest = transaction.request();
        productRequest.input('productId', item.productId);
        const productResult = await productRequest.query(productQuery);
        const product = productResult.recordset[0];

        if (!product || !product.isActive) {
          throw new Error(`Product ${item.productId} is not available`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }

        const itemRequest = transaction.request();
        itemRequest.input('orderId', order.id);
        itemRequest.input('productId', item.productId);
        itemRequest.input('quantity', item.quantity);
        itemRequest.input('price', item.price);
        itemRequest.input('productName', product.name);
        itemRequest.input('productImageUrl', product.imageUrl);

        await itemRequest.query(itemQuery);

        // Update product stock
        const stockQuery = 'UPDATE Products SET stock = stock - @quantity WHERE id = @productId';
        const stockRequest = transaction.request();
        stockRequest.input('quantity', item.quantity);
        stockRequest.input('productId', item.productId);
        await stockRequest.query(stockQuery);
      }

      await transaction.commit();

      // Get the complete order with items
      const completeOrder = await this.getOrderById(order.id);
      if (!completeOrder) {
        throw new Error('Failed to retrieve created order');
      }
      return completeOrder;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getOrderById(id: number): Promise<Order | null> {
    const orderQuery = 'SELECT * FROM Orders WHERE id = @param0';
    const orderResult = await this.db.executeQuery(orderQuery, [id]);
    
    if (!orderResult.recordset[0]) {
      return null;
    }

    const order = orderResult.recordset[0];

    const itemsQuery = 'SELECT * FROM OrderItems WHERE orderId = @param0';
    const itemsResult = await this.db.executeQuery(itemsQuery, [id]);

    return {
      ...order,
      items: itemsResult.recordset
    };
  }

  async getOrdersByUserId(userId: number, page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM Orders WHERE userId = @param0';
    const countResult = await this.db.executeQuery(countQuery, [userId]);
    const total = countResult.recordset[0].total;

    // Get orders
    const ordersQuery = `
      SELECT * FROM Orders 
      WHERE userId = @param0
      ORDER BY createdAt DESC
      OFFSET @param1 ROWS
      FETCH NEXT @param2 ROWS ONLY
    `;
    const ordersResult = await this.db.executeQuery(ordersQuery, [userId, offset, limit]);

    // Get items for each order
    const orders: Order[] = [];
    for (const order of ordersResult.recordset) {
      const itemsQuery = 'SELECT * FROM OrderItems WHERE orderId = @param0';
      const itemsResult = await this.db.executeQuery(itemsQuery, [order.id]);
      
      orders.push({
        ...order,
        items: itemsResult.recordset
      });
    }

    return { orders, total };
  }

  async getAllOrders(page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM Orders';
    const countResult = await this.db.executeQuery(countQuery);
    const total = countResult.recordset[0].total;

    // Get orders
    const ordersQuery = `
      SELECT * FROM Orders 
      ORDER BY createdAt DESC
      OFFSET @param0 ROWS
      FETCH NEXT @param1 ROWS ONLY
    `;
    const ordersResult = await this.db.executeQuery(ordersQuery, [offset, limit]);

    // Get items for each order
    const orders: Order[] = [];
    for (const order of ordersResult.recordset) {
      const itemsQuery = 'SELECT * FROM OrderItems WHERE orderId = @param0';
      const itemsResult = await this.db.executeQuery(itemsQuery, [order.id]);
      
      orders.push({
        ...order,
        items: itemsResult.recordset
      });
    }

    return { orders, total };
  }

  async updateOrder(id: number, updateData: UpdateOrderData): Promise<Order | null> {
    const fields = [];
    const values = [];
    let paramIndex = 0;

    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateOrderData] !== undefined) {
        fields.push(`${key} = @param${paramIndex}`);
        values.push(updateData[key as keyof UpdateOrderData]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.getOrderById(id);
    }

    fields.push('updatedAt = GETDATE()');
    values.push(id);

    const query = `
      UPDATE Orders 
      SET ${fields.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @param${paramIndex}
    `;

    const result = await this.db.executeQuery(query, values);
    return result.recordset[0] ? await this.getOrderById(id) : null;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const transaction = this.db.getPool().transaction();
    
    try {
      await transaction.begin();

      // Delete order items first
      const deleteItemsQuery = 'DELETE FROM OrderItems WHERE orderId = @orderId';
      const deleteItemsRequest = transaction.request();
      deleteItemsRequest.input('orderId', id);
      await deleteItemsRequest.query(deleteItemsQuery);

      // Delete order
      const deleteOrderQuery = 'DELETE FROM Orders WHERE id = @id';
      const deleteOrderRequest = transaction.request();
      deleteOrderRequest.input('id', id);
      const result = await deleteOrderRequest.query(deleteOrderQuery);

      await transaction.commit();
      return result.rowsAffected[0] > 0;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
