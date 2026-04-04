-- E-commerce Database Schema for Azure SQL Database
-- Run this script to create the initial database structure

-- Create Users table
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    firstName NVARCHAR(100) NOT NULL,
    lastName NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20),
    address NVARCHAR(500),
    city NVARCHAR(100),
    state NVARCHAR(100),
    zipCode NVARCHAR(20),
    country NVARCHAR(100),
    isAdmin BIT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Create Products table
CREATE TABLE Products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category NVARCHAR(100) NOT NULL,
    imageUrl NVARCHAR(500) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    isActive BIT DEFAULT 1,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- Create CartItems table
CREATE TABLE CartItems (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    productId INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    productName NVARCHAR(255) NOT NULL,
    productPrice DECIMAL(10,2) NOT NULL,
    productImageUrl NVARCHAR(500) NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES Products(id) ON DELETE CASCADE,
    UNIQUE(userId, productId)
);

-- Create Orders table
CREATE TABLE Orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    status NVARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    totalAmount DECIMAL(10,2) NOT NULL,
    shippingAddress NVARCHAR(MAX) NOT NULL,
    billingAddress NVARCHAR(MAX) NOT NULL,
    paymentMethod NVARCHAR(50) NOT NULL,
    paymentStatus NVARCHAR(50) DEFAULT 'pending' CHECK (paymentStatus IN ('pending', 'paid', 'failed', 'refunded')),
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Create OrderItems table
CREATE TABLE OrderItems (
    id INT IDENTITY(1,1) PRIMARY KEY,
    orderId INT NOT NULL,
    productId INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    productName NVARCHAR(255) NOT NULL,
    productImageUrl NVARCHAR(500) NOT NULL,
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES Products(id)
);

-- Create indexes for better performance
CREATE INDEX IX_Users_Email ON Users(email);
CREATE INDEX IX_Products_Category ON Products(category);
CREATE INDEX IX_Products_IsActive ON Products(isActive);
CREATE INDEX IX_CartItems_UserId ON CartItems(userId);
CREATE INDEX IX_Orders_UserId ON Orders(userId);
CREATE INDEX IX_Orders_Status ON Orders(status);
CREATE INDEX IX_OrderItems_OrderId ON OrderItems(orderId);

-- Insert sample data
-- Sample Products
INSERT INTO Products (name, description, price, category, imageUrl, stock) VALUES
('Wireless Bluetooth Headphones', 'High-quality wireless headphones with noise cancellation and 30-hour battery life.', 199.99, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 50),
('Smartphone Case', 'Protective case for smartphones with shock absorption and wireless charging compatibility.', 29.99, 'Accessories', 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500', 100),
('Coffee Maker', 'Automatic drip coffee maker with programmable timer and thermal carafe.', 89.99, 'Appliances', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500', 25),
('Running Shoes', 'Comfortable running shoes with breathable mesh and cushioned sole.', 129.99, 'Sports', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 75),
('Laptop Stand', 'Adjustable aluminum laptop stand for better ergonomics and cooling.', 49.99, 'Accessories', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500', 40),
('Bluetooth Speaker', 'Portable wireless speaker with 360-degree sound and waterproof design.', 79.99, 'Electronics', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500', 60),
('Yoga Mat', 'Non-slip yoga mat made from eco-friendly materials with carrying strap.', 39.99, 'Sports', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500', 80),
('Desk Lamp', 'LED desk lamp with adjustable brightness and USB charging port.', 59.99, 'Furniture', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', 30),
('Water Bottle', 'Insulated stainless steel water bottle that keeps drinks cold for 24 hours.', 24.99, 'Accessories', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500', 120),
('Gaming Mouse', 'High-precision gaming mouse with customizable RGB lighting and programmable buttons.', 69.99, 'Electronics', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500', 45);

-- Create admin user (password: admin123)
INSERT INTO Users (email, password, firstName, lastName, isAdmin) VALUES
('admin@ecommerce.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K2', 'Admin', 'User', 1);

-- Create triggers for updatedAt timestamps
GO
CREATE TRIGGER TR_Users_UpdatedAt
ON Users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users 
    SET updatedAt = GETDATE()
    FROM Users u
    INNER JOIN inserted i ON u.id = i.id;
END;

GO
CREATE TRIGGER TR_Products_UpdatedAt
ON Products
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Products 
    SET updatedAt = GETDATE()
    FROM Products p
    INNER JOIN inserted i ON p.id = i.id;
END;

GO
CREATE TRIGGER TR_CartItems_UpdatedAt
ON CartItems
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE CartItems 
    SET updatedAt = GETDATE()
    FROM CartItems c
    INNER JOIN inserted i ON c.id = i.id;
END;

GO
CREATE TRIGGER TR_Orders_UpdatedAt
ON Orders
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Orders 
    SET updatedAt = GETDATE()
    FROM Orders o
    INNER JOIN inserted i ON o.id = i.id;
END;
