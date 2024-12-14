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

			cartItems.forEach((item) => {
				try {
					const cartItemElement = this.createCartItemElement(item);
					cartContainer.appendChild(cartItemElement);
				} catch (itemError) {
					console.error("Error rendering cart item:", itemError, item);
				}
			});

			const totalQuantity = cartItems.reduce(
				(total, item) => total + (Number(item.quantity) || 0),
				0
			);
			const totalValue = cartItems.reduce(
				(total, item) =>
					total + (Number(item.price) || 0) * (Number(item.quantity) || 0),
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

	createCartItemElement(item) {
		const price = Number(item.price || 0);
		const quantity = Number(item.quantity || 1);
		const productId = item.product_id || "unknown";
		const name = item.name || "Unnamed Product";
		const imageUrl = item.image_url
			? `http://localhost:3000${item.image_url}`
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
		itemElement.innerHTML = `
            <img 
                src="${imageUrl}" 
                alt="${name}" 
                class="w-24 h-24 object-cover rounded-md mr-4"
                onerror="this.src='/images/default-image.jpg'"
            >
            <div class="flex-grow">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">${name}</h3>
                <p class="text-gray-600 mb-2">Price: $${price.toFixed(2)}</p>
                <div class="flex items-center space-x-2 mb-2">
                    <button 
                        class="decrease-quantity bg-gray-200 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-300 transition-colors" 
                        data-product-id="${productId}"
                    >
                        -
                    </button>
                    <input 
                        type="number" 
                        value="${quantity}" 
                        min="1" 
                        class="w-16 text-center border border-gray-300 rounded-md py-1"
                        data-product-id="${productId}"
                    >
                    <button 
                        class="increase-quantity bg-gray-200 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-300 transition-colors" 
                        data-product-id="${productId}"
                    >
                        +
                    </button>
                </div>
                <p class="font-bold text-blue-600">Subtotal: $${(
									price * quantity
								).toFixed(2)}</p>
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

	attachCartEventListeners() {
		// Remove previous event listeners to prevent duplicates
		this.removeExistingEventListeners();

		const decreaseButtons = document.querySelectorAll(".decrease-quantity");
		const increaseButtons = document.querySelectorAll(".increase-quantity");
		const quantityInputs = document.querySelectorAll('input[type="number"]');
		const removeButtons = document.querySelectorAll(". remove-item");
		const checkoutButton = document.querySelector(".proceed-checkout-btn");

		decreaseButtons.forEach((button) => {
			button.addEventListener("click", (e) => {
				const productId = e.target.dataset.productId;
				const input = document.querySelector(
					`input[data-product-id="${productId}"]`
				);
				if (input.value > 1) {
					input.value = parseInt(input.value) - 1;
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
				input.value = parseInt(input.value) + 1;
				this.updateCartItemQuantity(productId, input.value);
			});
		});

		quantityInputs.forEach((input) => {
			input.addEventListener("change", (e) => {
				const productId = e.target.dataset.productId;
				this.updateCartItemQuantity(productId, e.target.value);
			});
		});

		removeButtons.forEach((button) => {
			button.addEventListener("click", (e) => {
				const productId = e.target.closest(".remove-item").dataset.productId;
				this.removeCartItem(productId);
			});
		});

		if (checkoutButton) {
			checkoutButton.addEventListener("click", () => this.proceedToCheckout());
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
		try {
			const response = await fetch(
				`${this.apiBaseUrl}/cart/${this.userId}/remove`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ productId }),
				}
			);

			if (!response.ok) {
				const errorBody = await response.text();
				console.error("Error removing cart item:", errorBody);
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			this.renderCart();
		} catch (error) {
			console.error("Error removing cart item:", error);
		}
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

	removeExistingEventListeners() {
		// Logic to remove existing event listeners if necessary
	}

	showCartMessage(message, isError) {
		const messageContainer = document.querySelector("#cartMessage");
		if (messageContainer) {
			messageContainer.textContent = message;
			messageContainer.classList.toggle("text-red-500", isError);
			messageContainer.classList.toggle("text-green-500", !isError);
		}
	}
}

// Initialize cart manager
document.addEventListener("DOMContentLoaded", () => {
	const cartManager = new CartManager();
	cartManager.renderCart();
});
