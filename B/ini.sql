DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS products ;
DROP TABLE IF EXISTS orders;

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL NOT NULL,
    category TEXT,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    products JSON NOT NULL,
    total_price DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO products (name, description, price, category, stock) VALUES
('iPhone 14', 'Apple iPhone 14 - 128GB', 999.99, 'Tech', 10),
('MacBook Pro', 'Apple MacBook Pro M2', 1999.99, 'Tech', 5),
('AirPods Pro', 'Apple AirPods Pro - Wireless', 249.99, 'Tech', 15),
('Samsung Galaxy S22', 'Samsung smartphone 128GB', 799.99, 'Tech', 8),
('PlayStation 5', 'Sony PlayStation 5', 499.99, 'Gaming', 20);

INSERT INTO cart (user_id, product_id, quantity) VALUES
(1, 1, 2),  
(1, 3, 1), 
(2, 5, 1); 

INSERT INTO orders (user_id, products, total_price, status) VALUES
(1, '[{"product_id": 1, "quantity": 2}, {"product_id": 3, "quantity": 1}]', 2249.97, 'confirmed');