"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Product {
  id: number;
  name: string;
  price: number;
}

interface CartItem {
  product_id: number;
  quantity: number;
  name: string;
  price: number;
}

interface Order {
  id: number;
  status: string;
  products: CartItem[];
  total_price: number;
}

const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-1/3 text-black">
        {children}
        <button className="mt-4 bg-gray-500 text-white px-4 py-2 rounded" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: 1, category: "", stock: 1 });
  const userId = "1";
  const [serverUrl, setServerUrl] = useState<string>("http://localhost:3001");

  const fetchServerUrl = async () => {
    try {
      const response = await axios.get("http://localhost:4000/getServer");
      setServerUrl(response.data.server);
    } catch (error) {
      console.error("Error fetching server URL:", error);
    }
  };

  useEffect(() => {
    fetchServerUrl().then(() => {
      fetchProducts();
    });
  }, []);

  const fetchProducts = () => {
    axios.get(`${serverUrl}/products`)
      .then((response) => {
        setProducts(response.data);
      })
      .catch(error => console.error("Error fetching products:", error));
  };

  useEffect(() => {
    if (products.length > 0) {
      fetchCart();
      fetchOrders();
    }
  }, [products]);

  const fetchCart = () => {
    if (products.length === 0) return; // Vérifier que `products` est chargé
  
    axios.get(`${serverUrl}/cart/${userId}`)
      .then((response) => {
        const cartItems = response.data;
  
        const updatedCart = cartItems.map((item: CartItem) => {
          const product = products.find((p) => p.id === item.product_id);
          return {
            ...item,
            name: product ? product.name : "Unknown Product",
            product_id: product ? product.id : -1, 
            price: product ? product.price : 0,
          };
        });
  
        setCart(updatedCart);
      })
      .catch(error => console.error("Error fetching cart:", error));
  };
  
  const fetchOrders = () => {
    if (products.length === 0) return; 
  
    axios.get(`${serverUrl}/orders/${userId}`)
      .then((response) => {
        const fetchedOrders = response.data;
  
        const updatedOrders = fetchedOrders.map((order: Order) => ({
          ...order,
          products: order.products
            .map((item) => {
              const product = products.find((p) => p.id === item.product_id);
              return {
                ...item,
                name: product ? product.name : "Unknown Product",
                product_id: product ? product.id : `unknown`, 
                price: product ? product.price : 0,
              };
            })
        }));
  
        setOrders(updatedOrders);
      })
      .catch(error => console.error("Error fetching orders:", error));
  };
  

  const addToCart = (productId: number, quantity: number) => {
    axios.post(`${serverUrl}/cart/${userId}`, { productId, quantity })
      .then(() => fetchCart())
      .catch(error => console.error("Error adding to cart:", error));
  };

  const removeFromCart = (productId: number) => {
    axios.delete(`${serverUrl}/cart/${userId}/item/${productId}`)
      .then(() => fetchCart())
      .catch(error => console.error("Error removing from cart:", error));
  };

  const placeOrder = () => {
    const formattedProducts = cart.map((item) => ({
      product_id: item.product_id, 
      quantity: item.quantity
    }));
  
    axios.post(`${serverUrl}/orders`, { userId, products: formattedProducts })
      .then(() => {
        fetchOrders();
        setCart([]);
      })
      .catch(error => console.error("Error placing order:", error));
  };

  const createProduct = () => {
    axios.post(`${serverUrl}/products`, newProduct)
      .then(() => {
        setNewProduct({ name: "", description: "", price: 0, category: "", stock: 0 });
        setIsProductModalOpen(false);
        axios.get(`${serverUrl}/products`)
          .then((response) => setProducts(response.data));
      })
      .catch(error => console.error("Error creating product:", error));
  };

  const deleteProduct = (productId: number) => {
    axios.delete(`${serverUrl}/products/${productId}`)
      .then(() => axios.get(`${serverUrl}/products`)
        .then((response) => setProducts(response.data)))
      .catch(error => console.error("Error deleting product:", error));
  };

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  return (
    <div className="p-6 text-white bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold">Products</h1>
      <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setIsProductModalOpen(true)}>
        Create Product
      </button>
      <ul className="mt-4 space-y-2">
        {products.map((product) => (
          <li key={product.id} className="border p-2 rounded flex justify-between items-center">
            {product.name} - {product.price}€
            <div>
              <input type="number" min="1" defaultValue={1} className="ml-2 w-16 p-1 border rounded text-black" id={`qty-${product.id}`} />
              <button className="ml-2 bg-blue-500 text-white px-2 py-1 rounded"
                onClick={() => addToCart(product.id, parseInt((document.getElementById(`qty-${product.id}`) as HTMLInputElement).value))}>
                Add to Cart
              </button>
              <button className="ml-2 bg-red-500 text-white px-2 py-1 rounded" onClick={() => deleteProduct(product.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="text-2xl font-bold mt-6">Cart</h2>
      <ul className="mt-4 space-y-2">
        {cart.map((item) => (
          <li key={item.product_id} className="border p-2 rounded">
            {item.name} - Quantity: {item.quantity}
            <button className="ml-2 bg-red-500 text-white px-2 py-1 rounded" onClick={() => removeFromCart(item.product_id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded" onClick={placeOrder}>
        Place Order
      </button>

      <h1 className="text-3xl font-bold">Orders</h1>
      <ul className="mt-4 space-y-2">
        {orders.map((order) => (
          <li key={order.id} className="border p-2 rounded flex justify-between items-center">
            Order ID: {order.id} - Status: {order.status} - Cost: {order.total_price}
            <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => openOrderModal(order)}>
              View Details
            </button>
          </li>
        ))}
      </ul>

      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)}>
        <h2 className="text-xl font-bold mb-4">Create New Product</h2>
        <input type="text" placeholder="Name" className="w-full p-2 border rounded mb-2" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
        <input type="text" placeholder="Description" className="w-full p-2 border rounded mb-2" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
        <input type="number" placeholder="Price" className="w-full p-2 border rounded mb-2" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })} />
        <input type="text" placeholder="Category" className="w-full p-2 border rounded mb-2" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
        <input type="number" placeholder="Stock" className="w-full p-2 border rounded mb-2" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })} />
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={createProduct}>
          Save Product
        </button>
      </Modal>

      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)}>
        {selectedOrder && (
          <div>
            <h2 className="text-xl font-bold mb-2">Order #{selectedOrder.id}</h2>
            <p className="text-gray-700 mb-4">Status: {selectedOrder.status}</p>

            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2">Product Name</th>
                  <th className="border border-gray-300 px-4 py-2">Quantity</th>
                  <th className="border border-gray-300 px-4 py-2">Price</th>
                  <th className="border border-gray-300 px-4 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.products?.map((product) => (
                  <tr key={product.product_id} className="text-center">
                    <td className="border border-gray-300 px-4 py-2">{product.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{product.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2">{product.price}€</td>
                    <td className="border border-gray-300 px-4 py-2">{(product.quantity * product.price).toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

    </div>
  );
}