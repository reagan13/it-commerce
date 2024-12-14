class CartManager {
	constructor() {
		this.userId = null;
		this.cartItems = [];
		this.apiBaseUrl = "http://localhost:3000/api";
	}

	async fetchCartDetails() {
		try {
			const storedUserId = localStorage.getItem("userId");
			if (!storedUserId) {
				console.error("No user ID found");
				this.showCartMessage("Please log in to view your cart", false);
				return [];
			}

			this.userId = storedUserId;

			const response = await fetch(`${this.apiBaseUrl}/cart/${this.userId}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				const errorBody = await response.text();
				console.error("Error response:", errorBody);
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			this.cartItems = data.cartItems || [];
			return this.cartItems;
		} catch (error) {
			console.error("Error fetching cart details:", error);
			this.showCartMessage("Failed to load cart. Please try again.", false);
			return [];
		}
	}

	async renderCart() {
		try {
			const cartItems = await this.fetchCartDetails();
			const cartContainer = document.querySelector("#cartItemsContainer");

			if (!cartContainer) {
				console.error("Cart container not found");
				return;
			}

			cartContainer.innerHTML = "";

			if (cartItems.length === 0) {
				cartContainer.innerHTML = `
                    <div class="text-center text-gray-500 py-10">
                        <p class="text-xl">Your cart is empty</p>
                        <a href="/products.html" class="text-blue-600 hover:underline mt-4 inline-block">
                            Continue Shopping
                        </a>
                    </div>
                `;
				this.updateTotals(0, 0);
				return;
			}

			// Group cart items by product
			const groupedItems = this.groupCartItems(cartItems);

			// Render grouped items
			groupedItems.forEach((groupedItem) => {
				try {
					const cartItemElement =
						this.createGroupedCartItemElement(groupedItem);
					cartContainer.appendChild(cartItemElement);
				} catch (itemError) {
					console.error("Error rendering cart item:", itemError, groupedItem);
				}
			});

			const totalQuantity = groupedItems.reduce(
				(total, item) => total + item.totalQuantity,
				0
			);
			const totalValue = groupedItems.reduce(
				(total, item) => total + (Number(item.price) || 0) * item.totalQuantity,
				0
			);

			this.updateTotals(totalQuantity, totalValue);
			this.attachCartEventListeners();
		} catch (error) {
			console.error("Error rendering cart:", error);
			const cartContainer = document.querySelector("#cartItemsContainer");
			if (cartContainer) {
				cartContainer.innerHTML = `
                    <div class="text-center text-red-500 py-10">
                        <p>Failed to load cart. Please try again later.</p>
                    </div>
                `;
			}
		}
	}

	groupCartItems(cartItems) {
		const groupedItems = {};

		cartItems.forEach((item) => {
			const key = item.product_id;
			if (!groupedItems[key]) {
				groupedItems[key] = {
					...item,
					totalQuantity: item.quantity,
					orders: [item],
				};
			} else {
				groupedItems[key].totalQuantity += item.quantity;
				groupedItems[key].orders.push(item);
			}
		});

		return Object.values(groupedItems);
	}
	createGroupedCartItemElement(groupedItem) {
		const price = Number(groupedItem.price || 0);
		const totalQuantity = Number(groupedItem.totalQuantity || 0);
		const productId = groupedItem.product_id || "unknown";
		const name = groupedItem.name || "Unnamed Product";
		const imageUrl = groupedItem.image_url
			? `http://localhost:3000${groupedItem.image_url}`
			: "/public/products/card4-bg.png";

		const itemElement = document.createElement("div");
		itemElement.classList.add(
			"flex",
			"items-center",
			"bg-white",
			"p-4",
			"rounded-lg",
			"shadow-md",
			"mb-4"
		);

		// Calculate subtotal
		const subtotal = price * totalQuantity;

		// Create orders list
		const ordersListHTML = groupedItem.orders
			.map(
				(order) => `
            
        `
			)
			.join("");

		itemElement.innerHTML = `s
        <img 
            src="${imageUrl}" 
            alt="${name}" 
            class="w-24 h-24 object-cover rounded-md mr-4"
            onerror="this.src='/images/default-image.jpg'"
        >
        <div class="flex-grow">
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-semibold text-gray-800">${name}</h3>
                <p class="text-gray-600">Price: $${price.toFixed(2)}</p>
            </div>
            <ul class="mb-2">
                ${ordersListHTML}
            </ul>
            <div class="flex items-center space-x-2 mb-2">
                <button 
                    class="decrease-quantity bg-gray-200 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-300 transition-colors" 
                    data-product-id="${productId}"
                >
                    -
                </button>
                <input 
                    type="text" 
                    value="${totalQuantity}" 
                    readonly 
                    class="w-16 text-center border border-gray-300 rounded-md py-1 quantity-input bg-gray-100 cursor-not-allowed"
                    data-product-id="${productId}"
                >
                <button 
                    class="increase-quantity bg-gray-200 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-300 transition-colors" 
                    data-product-id="${productId}"
                >
                    +
                </button>
            </div>
            <p class="text-sm text-gray-600 mb-2">
                Total Quantity in Cart: <span class="total-quantity">${totalQuantity}</span>
            </p>
            <p class="font-bold text-blue-600 subtotal-display">
                Subtotal: $${subtotal.toFixed(2)}
            </p>
        </div>
        <button 
            class="remove-item text-red-500 hover:text-red-700 ml-4"
            data-product-id="${productId}"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
    `;

		return itemElement;
	}
	updateTotals(totalItems, totalValue) {
		try {
			const subtotalElement = document.querySelector("#subtotalDisplay");
			const taxElement = document.querySelector("#taxDisplay");
			const totalElement = document.querySelector("#totalDisplay");
			const cartItemCountElement = document.querySelector("#cart-item-count");

			if (subtotalElement) {
				subtotalElement.textContent = `$${totalValue.toFixed(2)}`;
			}

			if (taxElement) {
				const tax = totalValue * 0.1;
				taxElement.textContent = `$${tax.toFixed(2)}`;
			}

			if (totalElement) {
				const total = totalValue * 1.1;
				totalElement.textContent = `$${total.toFixed(2)}`;
			}

			if (cartItemCountElement) {
				cartItemCountElement.textContent = totalItems.toString();
			}
		} catch (error) {
			console.error("Error updating totals:", error);
		}
	}

	async updateCartItemQuantity(productId, quantity) {
		try {
			const response = await fetch(
				`${this.apiBaseUrl}/cart/${this.userId}/update`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ productId, quantity }),
				}
			);

			if (!response.ok) {
				const errorBody = await response.text();
				console.error("Error updating cart item:", errorBody);
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			this.renderCart();
		} catch (error) {
			console.error("Error updating cart item quantity:", error);
		}
	}

	async removeCartItem(productId) {
		// Create a custom confirmation dialog
		const confirmRemove = await this.showConfirmationDialog(
			"Remove Item",
			"Are you sure you want to remove this item from your cart?"
		);

		if (confirmRemove) {
			try {
				const response = await fetch(
					`${this.apiBaseUrl}/cart/remove`, // Correct endpoint
					{
						method: "DELETE",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							userId: this.userId,
							productId,
						}),
					}
				);
				if (!response.ok) {
					throw new Error("Failed to remove item from cart");
				}

				const data = await response.json();
				console.log("Item removed from cart:", data.message);
			} catch (error) {
				console.error("Error removing item from cart:", error);
			}
		}
	}

	// In attachCartEventListeners method
	attachCartEventListeners() {
		// Existing code...

		const removeButtons = document.querySelectorAll(".remove-item");
		removeButtons.forEach((button) => {
			button.addEventListener("click", (e) => {
				// Find the closest button or parent element with the product ID
				const removeButton = e.target.closest("[data-product-id]");
				if (removeButton) {
					const productId = removeButton.dataset.productId;
					this.removeCartItem(productId);
				}
			});
		});
	}
	// New method to create a custom confirmation dialog
	showConfirmationDialog(title, message) {
		return new Promise((resolve) => {
			// Create dialog container
			const dialogOverlay = document.createElement("div");
			dialogOverlay.classList.add(
				"fixed",
				"inset-0",
				"bg-black",
				"bg-opacity-50",
				"flex",
				"items-center",
				"justify-center",
				"z-50"
			);

			// Create dialog content
			const dialogContent = document.createElement("div");
			dialogContent.classList.add(
				"bg-white",
				"rounded-lg",
				"p-6",
				"max-w-md",
				"w-full",
				"mx-4"
			);
			dialogContent.innerHTML = `
            <h2 class="text-xl font-bold mb-4">${title}</h2>
            <p class="mb-6">${message}</p>
            <div class="flex justify-end space-x-4">
                <button id="cancelBtn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                    Cancel
                </button>
                <button id="confirmBtn" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                    Remove
                </button>
            </div>
        `;

			// Add to overlay
			dialogOverlay.appendChild(dialogContent);

			// Add to body
			document.body.appendChild(dialogOverlay);

			// Get buttons
			const confirmBtn = dialogOverlay.querySelector("#confirmBtn");
			const cancelBtn = dialogOverlay.querySelector("#cancelBtn");

			// Add event listeners
			confirmBtn.addEventListener("click", () => {
				document.body.removeChild(dialogOverlay);
				resolve(true);
			});

			cancelBtn.addEventListener("click", () => {
				document.body.removeChild(dialogOverlay);
				resolve(false);
			});
		});
	}

	// Update showCartMessage method to be more flexible
	showCartMessage(message, isSuccess = true) {
		// Create message container if it doesn't exist
		let messageContainer = document.querySelector("#cartMessage");
		if (!messageContainer) {
			messageContainer = document.createElement("div");
			messageContainer.id = "cartMessage";
			messageContainer.classList.add(
				"fixed",
				"top-4",
				"left-1/2",
				"transform",
				"-translate-x-1/2",
				"px-4",
				"py-2",
				"rounded",
				"shadow-lg",
				"z-50",
				"transition-all",
				"duration-300"
			);
			document.body.appendChild(messageContainer);
		}

		// Set message and styling
		messageContainer.textContent = message;
		messageContainer.classList.remove(
			"bg-green-500",
			"bg-red-500",
			"text-white"
		);

		if (isSuccess) {
			messageContainer.classList.add("bg-green-500", "text-white");
		} else {
			messageContainer.classList.add("bg-red-500", "text-white");
		}

		// Show message
		messageContainer.classList.remove("opacity-0", "-top-10");
		messageContainer.classList.add("opacity-100", "top-4");

		// Automatically hide after 3 seconds
		setTimeout(() => {
			messageContainer.classList.remove("opacity-100", "top-4");
			messageContainer.classList.add("opacity-0", "-top-10");
		}, 3000);
	}
	async proceedToCheckout() {
		try {
			const response = await fetch(
				`${this.apiBaseUrl}/checkout/${this.userId}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			if (!response.ok) {
				const errorBody = await response.text();
				console.error("Error during checkout:", errorBody);
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			// Handle successful checkout (e.g., redirect to a confirmation page)
			window.location.href = `/checkout-confirmation.html?orderId=${result.orderId}`;
		} catch (error) {
			console.error("Error proceeding to checkout:", error);
		}
	}
	createCartItemElement(item) {
		const price = Number(item.price || 0);
		const productId = item.product_id || "unknown";
		const name = item.name || "Unnamed Product";
		const imageUrl = item.image_url
			? `http://localhost:3000${item.image_url}`
			: "/public/products/card4-bg.png";

		// Calculate total quantity for this product
		const totalQuantity = this.cartItems
			.filter((cartItem) => cartItem.product_id === productId)
			.reduce((total, cartItem) => total + cartItem.quantity, 0);

		const itemElement = document.createElement("div");
		itemElement.classList.add(
			"flex",
			"items-center",
			"bg-white",
			"p-4",
			"rounded-lg",
			"shadow-md",
			"mb-4"
		);

		// Calculate subtotal
		const subtotal = price * totalQuantity;

		itemElement.innerHTML = `
        <img 
            src="${imageUrl}" 
            alt="${name}" 
            class="w-24 h-24 object-cover rounded-md mr-4"
            onerror="this.src='/images/default-image.jpg'"
        >
        <div class="flex-grow">
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-semibold text-gray-800">${name}</h3>
                <p class="text-gray-600">Price: $${price.toFixed(2)}</p>
            </div>
            <div class="flex items-center space-x-2 mb-2">
                <button 
                    class="decrease-quantity bg-gray-200 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-300 transition-colors" 
                    data-product-id="${productId}"
                >
                    -
                </button>
                <input 
                    type="number" 
                    value="${totalQuantity}" 
                    min="1" 
                    max="10" 
                    class="w-16 text-center border border-gray-300 rounded-md py-1 quantity-input"
                    data-product-id="${productId}"
                >
                <button 
                    class="increase-quantity bg-gray-200 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-300 transition-colors" 
                    data-product-id="${productId}"
                >
                    +
                </button>
            </div>
            <p class="text-sm text-gray-600 mb-2">
                Total Quantity in Cart: <span class="total-quantity">${totalQuantity}</span>
            </p>
            <p class="font-bold text-blue-600 subtotal-display">
                Subtotal: $${subtotal.toFixed(2)}
            </p>
        </div>
        <button 
            class="remove-item text-red-500 hover:text-red-700 ml-4"
            data-product-id="${productId}"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
    `;

		return itemElement;
	}

	attachCartEventListeners() {
		const decreaseButtons = document.querySelectorAll(".decrease-quantity");
		const increaseButtons = document.querySelectorAll(".increase-quantity");

		decreaseButtons.forEach((button) => {
			button.addEventListener("click", (e) => {
				const productId = e.target.dataset.productId;
				const input = document.querySelector(
					`input[data-product-id="${productId}"]`
				);
				const totalQuantitySpan = input
					.closest(".flex-grow")
					.querySelector(".total-quantity");
				const subtotalDisplay = input
					.closest(".flex-grow")
					.querySelector(".subtotal-display");
				const price = parseFloat(
					input
						.closest(".flex-grow")
						.querySelector('p[class*="text-gray-600"]')
						.textContent.replace("Price: $", "")
				);

				// Ensure input value doesn't go below 1
				if (parseInt(input.value) > 1) {
					input.value = parseInt(input.value) - 1;

					// Update subtotal display
					const newSubtotal = price * parseInt(input.value);
					subtotalDisplay.textContent = `Subtotal: $${newSubtotal.toFixed(2)}`;

					this.updateCartItemQuantity(productId, input.value);
				}
			});
		});

		increaseButtons.forEach((button) => {
			button.addEventListener("click", (e) => {
				const productId = e.target.dataset.productId;
				const input = document.querySelector(
					`input[data-product-id="${productId}"]`
				);
				const totalQuantitySpan = input
					.closest(".flex-grow")
					.querySelector(".total-quantity");
				const subtotalDisplay = input
					.closest(".flex-grow")
					.querySelector(".subtotal-display");
				const totalQuantity = parseInt(totalQuantitySpan.textContent);
				const price = parseFloat(
					input
						.closest(".flex-grow")
						.querySelector('p[class*="text-gray-600"]')
						.textContent.replace("Price: $", "")
				);

				// Allow incrementing up to a maximum of 10 or the total quantity
				const currentQuantity = parseInt(input.value);

				if (currentQuantity < 10) {
					input.value = currentQuantity + 1;

					// Update subtotal display
					const newSubtotal = price * parseInt(input.value);
					subtotalDisplay.textContent = `Subtotal: $${newSubtotal.toFixed(2)}`;

					this.updateCartItemQuantity(productId, input.value);
				}
			});
		});
		// Add remove item listeners
		const removeButtons = document.querySelectorAll(".remove-item");
		removeButtons.forEach((button) => {
			button.addEventListener("click", (e) => {
				const productId = e.target.closest(".remove-item").dataset.productId;
				this.removeCartItem(productId);
			});
		});
	}
	async updateCartItemQuantity(productId, quantity) {
		try {
			const response = await fetch(
				`${this.apiBaseUrl}/cart/${this.userId}/update`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						productId,
						quantity: parseInt(quantity),
					}),
				}
			);

			if (!response.ok) {
				const errorBody = await response.text();
				console.error("Error updating cart item:", errorBody);
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// Re-render the cart to reflect changes
			await this.renderCart();
		} catch (error) {
			console.error("Error updating cart item quantity:", error);
			this.showCartMessage("Failed to update cart. Please try again.", false);
		}
	}
	removeExistingEventListeners() {
		// Logic to remove existing event listeners if necessary
	}
}

// Initialize cart manager
document.addEventListener("DOMContentLoaded", () => {
	const cartManager = new CartManager();
	cartManager.renderCart();
});
