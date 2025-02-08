import express, { Application, Request, Response } from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import cors from "cors";

dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3001;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: parseInt(process.env.DB_PORT || "5432"),
});

app.use(express.json());
app.use(cors());

// Products Routes
app.get("/products", async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, inStock } = req.query;
    let query = "SELECT * FROM products";
    const conditions = [];
    const values = [];

    if (category) {
      conditions.push("category = $1");
      values.push(category);
    }
    if (inStock) {
      conditions.push("stock > 0");
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.get("/products/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.post("/products", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, stock } = req.body;
    if (!name || !price || !stock) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    const result = await pool.query(
      "INSERT INTO products (name, description, price, category, stock) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, description, price, category, stock]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.put("/products/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(", ");
    const values = Object.values(updates);

    if (fields.length === 0) {
      res.status(400).json({ message: "No updates provided" });
      return;
    }

    const result = await pool.query(
      `UPDATE products SET ${fields} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.delete("/products/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Orders Routes
app.post("/orders", async (req: Request, res: Response) => {
    try {
        const { userId, products } = req.body;
        if (!userId || !products || products.length === 0) {
            res.status(400).json({ message: "Invalid order request" });
            return;
        }
  
        // Calculate total price
        const productIds = products.map((p: { product_id: number }) => p.product_id);
        const query = "SELECT id, price FROM products WHERE id = ANY($1)";
        const { rows: productPrices } = await pool.query(query, [productIds]);
        
        if (productPrices.length !== products.length) {
            res.status(400).json({ message: "One or more product IDs are invalid" });
            return;
        }
    
        let total_price = products.reduce((acc: number, item: { product_id: number; quantity: number }) => {
            const product = productPrices.find((p) => p.id === item.product_id);
            return acc + (product ? product.price * item.quantity : 0);
        }, 0);
    
        total_price = parseFloat(total_price.toFixed(2));
    
        const orderResult = await pool.query(
            "INSERT INTO orders (user_id, products, total_price, status) VALUES ($1, $2, $3, 'pending') RETURNING *",
            [userId, JSON.stringify(products), total_price]
        );
    
        await pool.query("DELETE FROM cart WHERE user_id = $1", [userId]);

      res.status(201).json({ message: "Order created", order: orderResult.rows[0] });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
});


app.get("/orders/:userId", async (req: Request<{ userId: string }>, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const orders = await pool.query("SELECT * FROM orders WHERE user_id = $1", [userId]);
    res.json(orders.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Cart Routes
app.post("/cart/:userId", async (req: Request<{ userId: string }>, res: Response) => {
    try {
        const { userId } = req.params;
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            res.status(400).json({ message: "Product ID and quantity are required" });
            return;
        }

        // Check if product is already in cart
        const existingCartItem = await pool.query(
            "SELECT * FROM cart WHERE user_id = $1 AND product_id = $2",
            [userId, productId]
        );

        if (existingCartItem.rows.length > 0) {
            // Update quantity if product exists in cart
            await pool.query(
                "UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3",
                [quantity, userId, productId]
            );
            res.status(200).json({ message: "Cart updated successfully" });
        } else {
            // Insert new product into cart
            await pool.query(
                "INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)",
                [userId, productId, quantity]
            );
            res.status(201).json({ message: "Product added to cart" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
  

app.get("/cart/:userId", async (req: Request<{ userId: string }>, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await pool.query("SELECT * FROM cart WHERE user_id = $1", [userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.delete("/cart/:userId/item/:productId", async (req: Request<{ userId: string; productId: string }>, res: Response): Promise<void> => {
  try {
    const { userId, productId } = req.params;
    await pool.query("DELETE FROM cart WHERE user_id = $1 AND product_id = $2", [userId, productId]);
    res.json({ message: "Product removed from cart" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`✅ API running on http://localhost:${port}`);
});