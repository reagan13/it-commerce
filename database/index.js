const express = require("express");
const mysql = require("mysql2");
const app = express();
const PORT = 3000;
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");

const cors = require("cors");

// Completely open CORS configuration
const corsOptions = {
	origin: true, // Allow all origins
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true, // Important for cookies and sessions
	optionsSuccessStatus: 200,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Parse incoming JSON requests
app.use(bodyParser.json());

// Create the MySQL connection
const connection = mysql.createConnection({
	host: "localhost",
	user: "root", // Replace with your MySQL username
	password: "", // Replace with your MySQL password
	database: "commerece", // Replace with your database name
});

// Connect to MySQL
connection.connect((err) => {
	if (err) {
		console.error("Error connecting to MySQL:", err.stack);
		return;
	}
	console.log("Connected to MySQL as ID", connection.threadId);
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

// User
// signup
// Signup API Endpoint
app.post("/api/signup", (req, res) => {
	const { first_name, last_name, email, password, confirm_password } = req.body;

	// Basic validation
	if (!first_name || !last_name || !email || !password || !confirm_password) {
		return res.status(400).json({ error: "All fields are required" });
	}

	// Check if passwords match
	if (password !== confirm_password) {
		return res.status(400).json({ error: "Passwords do not match" });
	}

	// Check if email already exists
	const checkEmailQuery = "SELECT * FROM users WHERE email = ?";
	connection.query(checkEmailQuery, [email], (err, results) => {
		if (err) {
			return res
				.status(500)
				.json({ error: "Database error", details: err.message });
		}

		if (results.length > 0) {
			return res.status(400).json({ error: "Email already in use" });
		}

		// Hash the password before saving
		bcrypt.hash(password, 10, (err, hashedPassword) => {
			if (err) {
				return res.status(500).json({ error: "Error hashing password" });
			}

			// Insert new user into the database
			const insertQuery =
				"INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)";

			connection.query(
				insertQuery,
				[first_name, last_name, email, hashedPassword],
				(err, results) => {
					if (err) {
						return res
							.status(500)
							.json({ error: "Error saving user", details: err.message });
					}

					res.status(201).json({
						message: "User successfully created",
						userId: results.insertId,
					});
				}
			);
		});
	});
});

// Login
// Sign-In API Endpoint
app.post("/api/signin", (req, res) => {
	const { email, password } = req.body;

	// Basic validation
	if (!email || !password) {
		return res.status(400).json({ error: "Email and password are required" });
	}

	// Query the database to check if the email exists
	const query = "SELECT * FROM users WHERE email = ?";
	connection.query(query, [email], (err, results) => {
		if (err) {
			return res
				.status(500)
				.json({ error: "Database error", details: err.message });
		}

		if (results.length === 0) {
			return res.status(400).json({ error: "Invalid email or password" });
		}

		// Get the user from the database (we expect only one result)
		const user = results[0];

		// Compare the entered password with the hashed password in the database
		bcrypt.compare(password, user.password_hash, (err, isMatch) => {
			if (err) {
				return res
					.status(500)
					.json({ error: "Error comparing passwords", details: err.message });
			}

			if (!isMatch) {
				return res.status(400).json({ error: "Invalid email or password" });
			}

			// If passwords match, return success response
			res.status(200).json({
				message: "Sign-in successful",
				userId: user.id,
				firstName: user.first_name,
				lastName: user.last_name,
				email: user.email,
			});
		});
	});
});

// get all products
app.get("/api/products", (req, res) => {
	const query = "SELECT * FROM products";

	console.log("Fetching products...");

	connection.query(query, (err, results) => {
		if (err) {
			console.error("Error retrieving products:", err.stack);
			return res.status(500).json({
				error: "Error retrieving products",
				details: err.message,
			});
		}

		console.log(`Retrieved ${results.length} products`);

		// Optional: Log the first product for debugging
		if (results.length > 0) {
			console.log("First Product:", results[0]);
		}

		res.json(results);
	});
});

/// In your Express backend:
app.post("/api/cart", (req, res) => {
	const { user_id, product_id, quantity } = req.body;

	// Basic validation
	if (!user_id || !product_id || !quantity) {
		return res
			.status(400)
			.json({ error: "User ID, Product ID, and Quantity are required" });
	}

	// Check if the product already exists in the cart for the given user
	const checkQuery = "SELECT * FROM cart WHERE user_id = ? AND product_id = ?";
	connection.query(checkQuery, [user_id, product_id], (err, results) => {
		if (err) {
			return res
				.status(500)
				.json({ error: "Database error", details: err.message });
		}

		if (results.length > 0) {
			// If the product already exists in the cart, add the new quantity to the existing quantity
			const newQuantity = results[0].quantity + quantity; // Increment the quantity

			const updateQuery =
				"UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?";
			connection.query(
				updateQuery,
				[newQuantity, user_id, product_id],
				(err, updateResults) => {
					if (err) {
						return res
							.status(500)
							.json({ error: "Error updating cart", details: err.message });
					}

					res.status(200).json({
						message: "Cart updated successfully",
						cartItem: {
							user_id,
							product_id,
							quantity: newQuantity, // Return the updated quantity
						},
					});
				}
			);
		} else {
			// If the product doesn't exist in the cart, add it with the specified quantity
			const insertQuery =
				"INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)";
			connection.query(
				insertQuery,
				[user_id, product_id, quantity],
				(err, insertResults) => {
					if (err) {
						return res
							.status(500)
							.json({ error: "Error adding to cart", details: err.message });
					}

					res.status(200).json({
						message: "Product added to cart successfully",
						cartItem: {
							user_id,
							product_id,
							quantity,
						},
					});
				}
			);
		}
	});
});

// GET Cart - Fetches the user's cart
// Cart route
app.get("/api/cart/:userId", (req, res) => {
	const userId = req.params.userId;
	console.log("Fetching cart for user", userId);

	if (!userId) {
		return res.status(400).json({ error: "User ID is required" });
	}

	// Updated query to join with products to get full product details
	const query = `
        SELECT 
            c.product_id, 
            c.quantity, 
            p.name, 
            p.price, 
            p.image
        FROM 
            cart c
        JOIN 
            products p ON c.product_id = p.id
        WHERE 
            c.user_id = ?
    `;

	connection.query(query, [userId], (err, results) => {
		if (err) {
			console.error("Database error:", err);
			return res.status(500).json({
				error: "Error fetching cart",
				details: err.message,
			});
		}

		// If no items in cart
		if (results.length === 0) {
			return res.status(200).json({
				message: "Cart is empty",
				cartItems: [],
				totalItems: 0,
				totalValue: 0,
			});
		}

		// Calculate total cart value
		const totalValue = results.reduce((total, item) => {
			return total + item.price * item.quantity;
		}, 0);

		res.status(200).json({
			cartItems: results,
			totalItems: results.length,
			totalValue: totalValue.toFixed(2),
		});
	});
});

// Catch-all route handler to help diagnose routing issues
app.use((req, res) => {
	console.log(`Received ${req.method} request to ${req.path}`);
	res.status(404).json({
		error: "Not Found",
		path: req.path,
		method: req.method,
	});
});

// Cart Update Endpoint
app.post("/api/cart/update", (req, res) => {
	const { userId, productId, quantity } = req.body;

	if (!userId || !productId || quantity === undefined) {
		return res
			.status(400)
			.json({ error: "User ID, Product ID, and Quantity are required" });
	}

	// If quantity is 0 or less, remove the item from the cart
	if (quantity <= 0) {
		const removeQuery = "DELETE FROM cart WHERE user_id = ? AND product_id = ?";
		connection.query(removeQuery, [userId, productId], (err, result) => {
			if (err) {
				return res.status(500).json({
					error: "Database error",
					details: err.message,
				});
			}

			return res.status(200).json({
				message: "Item removed from cart successfully",
			});
		});
	} else {
		// Update or insert the cart item
		const upsertQuery = `
            INSERT INTO cart (user_id, product_id, quantity) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE quantity = ?
        `;

		connection.query(
			upsertQuery,
			[userId, productId, quantity, quantity],
			(err, result) => {
				if (err) {
					return res.status(500).json({
						error: "Database error",
						details: err.message,
					});
				}

				res.status(200).json({
					message: "Cart updated successfully",
				});
			}
		);
	}
});

// Remove Item from Cart Endpoint
app.post("/api/cart/remove", (req, res) => {
	const { userId, productId } = req.body;

	if (!userId || !productId) {
		return res
			.status(400)
			.json({ error: "User ID and Product ID are required" });
	}

	const removeQuery = "DELETE FROM cart WHERE user_id = ? AND product_id = ?";
	connection.query(removeQuery, [userId, productId], (err, result) => {
		if (err) {
			return res.status(500).json({
				error: "Database error",
				details: err.message,
			});
		}

		res.status(200).json({ message: "Item removed from cart successfully" });
	});
});

// Get Cart Details Endpoint
app.post("/api/cart/details", (req, res) => {
	const { userId, productIds } = req.body;

	if (!userId || !productIds || !Array.isArray(productIds)) {
		return res
			.status(400)
			.json({ error: "User ID and Product IDs are required" });
	}

	// Get cart items with product details
	const query = `
        SELECT 
            p.id, 
            p.name, 
            p.description, 
            p.price, 
            p.image, 
            c.quantity
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ? AND p.id IN (?)
    `;

	connection.query(query, [userId, productIds], (err, results) => {
		if (err) {
			return res.status(500).json({
				error: "Database error",
				details: err.message,
			});
		}

		res.status(200).json(results);
	});
});

// Place Order Endpoint
app.post("/api/orders/place", (req, res) => {
	const { userId, items } = req.body;

	if (!userId || !items || items.length === 0) {
		return res.status(400).json({ error: "User ID and items are required" });
	}

	// Start a transaction
	connection.beginTransaction((err) => {
		if (err) {
			return res.status(500).json({
				error: "Transaction start failed",
				details: err.message,
			});
		}

		// Insert order
		const orderQuery =
			"INSERT INTO orders (user_id, order_date, total_amount) VALUES (?, NOW(), ?)";

		// Calculate total amount
		const totalAmount = items.reduce((total, item) => {
			return total + item.price * item.quantity;
		}, 0);

		connection.query(orderQuery, [userId, totalAmount], (err, orderResult) => {
			if (err) {
				return connection.rollback(() => {
					res.status(500).json({
						error: "Failed to create order",
						details: err.message,
					});
				});
			}

			const orderId = orderResult.insertId;

			// Prepare order items
			const orderItemsQuery =
				"INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?";
			const orderItemsValues = items.map((item) => [
				orderId,
				item.id,
				item.quantity,
				item.price,
			]);

			connection.query(
				orderItemsQuery,
				[orderItemsValues],
				(err, orderItemsResult) => {
					if (err) {
						return connection.rollback(() => {
							res.status(500).json({
								error: "Failed to add order items",
								details: err.message,
							});
						});
					}

					// Remove items from cart
					const removeCartQuery = "DELETE FROM cart WHERE user_id = ?";
					connection.query(removeCartQuery, [userId], (err, removeResult) => {
						if (err) {
							return connection.rollback(() => {
								res.status(500).json({
									error: "Failed to clear cart",
									details: err.message,
								});
							});
						}

						// Commit the transaction
						connection.commit((err) => {
							if (err) {
								return connection.rollback(() => {
									res.status(500).json({
										error: "Transaction commit failed",
										details: err.message,
									});
								});
							}

							res.status(200).json({
								message: "Order placed successfully",
								orderId: orderId,
							});
						});
					});
				}
			);
		});
	});
});

// Get User Orders Endpoint
app.get("/api/orders", (req, res) => {
	const { userId } = req.query;

	if (!userId) {
		return res.status(400).json({ error: "User ID is required" });
	}

	const query = `
        SELECT 
            o.id AS order_id, 
            o.order_date, 
            o.total_amount,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'product_id', oi.product_id,
                    'product_name', p.name,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'product_image', p.image
                )
            ) AS items
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        GROUP BY o.id, o.order_date, o.total_amount
        ORDER BY o.order_date DESC
    `;

	connection.query(query, [userId], (err, results) => {
		if (err) {
			return res.status(500).json({
				error: "Failed to retrieve orders",
				details: err.message,
			});
		}

		// Parse the JSON_ARRAYAGG result
		const parsedResults = results.map((order) => ({
			...order,
			items: JSON.parse(order.items),
		}));

		res.status(200).json(parsedResults);
	});
});
