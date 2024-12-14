// DOM Elements (move to top to ensure they're defined early)
const productsGrid = document.getElementById("productsGrid");
const quickViewModal = document.getElementById("quickViewModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalContent = document.getElementById("modalContent");
const searchInput = document.getElementById("searchInput");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");

// Global variable to store products
let products = [];

// Render Products Function
function renderProducts(filteredProducts = products) {
	if (!productsGrid) {
		console.error("Products grid element not found");
		return;
	}

	productsGrid.innerHTML = filteredProducts
		.map(
			(product) => `
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <img 
                        src="${product.image}" 
                        alt="${product.name}" 
                        class="w-full h-48 object-cover"
                    >
                    <div class="p-4">
                        <h3 class="text-lg font-semibold">${product.name}</h3>
                        <p class="text-gray-600 text-sm">${
													product.description
												}</p>
                        <div class="flex justify-between items-center mt-4">
                            <span class="text-xl font-bold text-blue-600">$${parseFloat(
															product.price
														).toFixed(2)}</span>
                            <button 
                                onclick="openQuickView(${product.id})" 
                                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Quick View
                            </button>
                        </div>
                    </div>
                </div>
            `
		)
		.join("");
}

// Open Quick View Modal
function openQuickView(productId) {
	const product = products.find((p) => p.id === productId);

	if (product) {
		modalContent.innerHTML = `
                    <div class="flex">
                        <img 
                            src="${product.image}" 
                            alt="${product.name}" 
                            class="w-1/2 object-cover rounded-lg"
                        >
                        <div class="pl-6 w-1/2">
                            <h2 class="text-2xl font-bold mb-4">${
															product.name
														}</h2>
                            <p class="text-gray-600 mb-4">${
															product.fullDescription
														}</p>
                            
                            <div class="mb-4">
                                <h3 class="font-semibold text-lg mb-2">Specifications:</h3>
                                <ul class="space-y-1">
                                    ${Object.entries(product.specs || {})
																			.map(
																				([key, value]) =>
																					`<li class="text-gray-700">
                                            <span class="font-medium">${key}:</span> ${value}
                                        </li>`
																			)
																			.join("")}
                                </ul>
                            </div>
                            
                            <div class="flex justify-between items-center mt-6">
                                <span class="text-2xl font-bold text-blue-600">
                                    $${parseFloat(product.price).toFixed(2)}
                                </span>
                                <button class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                `;

		quickViewModal.classList.remove("hidden");
	}
}

// Close Quick View Modal
function closeQuickView() {
	quickViewModal.classList.add("hidden");
}

// Event Listeners for Modal Closing
document.addEventListener("DOMContentLoaded", () => {
	// Close modal when close button is clicked
	if (closeModalBtn) {
		closeModalBtn.addEventListener("click", (event) => {
			event.stopPropagation(); // Prevent event from bubbling
			closeQuickView();
		});
	}

	// Close modal when clicking outside the modal content
	if (quickViewModal) {
		quickViewModal.addEventListener("click", (event) => {
			// Check if the click was on the modal overlay (not on the content)
			if (event.target === quickViewModal) {
				closeQuickView();
			}
		});
	}

	// Optional: Close modal with Escape key
	document.addEventListener("keydown", (event) => {
		if (
			event.key === "Escape" &&
			!quickViewModal.classList.contains("hidden")
		) {
			closeQuickView();
		}
	});
});

// Filter Products
function filterProducts() {
	// Get search term
	const searchTerm = searchInput.value.trim().toLowerCase();

	// Get selected categories
	const selectedCategories = Array.from(
		document.querySelectorAll('input[type="checkbox"]:checked')
	).map((cb) => cb.value);

	// Get price range
	const minPrice = parseFloat(document.getElementById("minPrice").value) || 0;
	const maxPrice =
		parseFloat(document.getElementById("maxPrice").value) || Infinity;

	// Get selected price range radio (if any)
	const selectedPriceRange = document.querySelector(
		'input[name="priceRange"]:checked'
	);

	// If everything is reset, show all products
	if (
		searchTerm === "" &&
		selectedCategories.length === 0 &&
		minPrice === 0 &&
		maxPrice === Infinity &&
		!selectedPriceRange
	) {
		renderProducts(products);
		return;
	}

	// Filter products
	const filteredProducts = products.filter((product) => {
		// Search filter
		const matchesSearch =
			searchTerm === "" ||
			product.name.toLowerCase().includes(searchTerm) ||
			product.description.toLowerCase().includes(searchTerm);

		// Category filter
		const matchesCategory =
			selectedCategories.length === 0 ||
			selectedCategories.includes(product.category);

		// Price filter
		const productPrice = parseFloat(product.price);
		let matchesPrice = true;

		// Check price range radio first
		if (selectedPriceRange) {
			switch (selectedPriceRange.value) {
				case "0-100":
					matchesPrice = productPrice >= 0 && productPrice <= 100;
					break;
				case "100-500":
					matchesPrice = productPrice >= 100 && productPrice <= 500;
					break;
				case "500-1000":
					matchesPrice = productPrice >= 500 && productPrice <= 1000;
					break;
				case "1000+":
					matchesPrice = productPrice > 1000;
					break;
			}
		} else {
			// If no radio selected, use min/max price inputs
			matchesPrice = productPrice >= minPrice && productPrice <= maxPrice;
		}

		return matchesSearch && matchesCategory && matchesPrice;
	});

	// Render results
	if (filteredProducts.length === 0) {
		productsGrid.innerHTML = `
            <div class="col-span-5 text-center py-10">
                <h2 class="text-2xl font-bold text-gray-600 mb-4">
                    No Products Found
                </h2>
                <p class="text-gray-500">
                    Try adjusting your search or filter criteria.
                </p>
            </div>
        `;
	} else {
		renderProducts(filteredProducts);
	}
}

// Setup Filter Listeners
function setupFilterListeners() {
	// Checkbox category filters
	const categoryCheckboxes = document.querySelectorAll(
		'input[type="checkbox"]'
	);
	categoryCheckboxes.forEach((checkbox) => {
		checkbox.addEventListener("change", filterProducts);
	});

	// Price range radio buttons
	const priceRangeInputs = document.querySelectorAll(
		'input[name="priceRange"]'
	);
	priceRangeInputs.forEach((input) => {
		input.addEventListener("change", (e) => {
			// Clear min and max price inputs when radio is selected
			document.getElementById("minPrice").value = "";
			document.getElementById("maxPrice").value = "";

			filterProducts();
		});
	});

	// Price input fields
	const priceInputs = document.querySelectorAll("#minPrice, #maxPrice");
	priceInputs.forEach((input) => {
		input.addEventListener("input", () => {
			// Uncheck price range radio buttons when manually inputting
			const priceRangeInputs = document.querySelectorAll(
				'input[name="priceRange"]'
			);
			priceRangeInputs.forEach((radio) => (radio.checked = false));
			filterProducts();
		});
	});

	// Search input
	searchInput.addEventListener("input", filterProducts);
}

// Reset Filters Function
function resetFilters() {
	// Clear search input
	searchInput.value = "";

	// Uncheck all category checkboxes
	document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
		cb.checked = false;
	});

	// Uncheck all price range radios
	document.querySelectorAll('input[name="priceRange"]').forEach((radio) => {
		radio.checked = false;
	});

	// Reset price inputs
	document.getElementById("minPrice").value = "";
	document.getElementById("maxPrice").value = "";

	// Render all products
	renderProducts(products);
}

// Optional: Add a reset button to your HTML
// <button onclick="resetFilters()" class="bg-gray-200 text-gray-700 px-4 py-2 rounded">Reset Filters</button>

// Fetch Products from Backend
async function fetchProducts() {
	try {
		const response = await fetch("http://localhost:3000/api/products", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const errorBody = await response.text();
			console.error("Server response:", errorBody);
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const rawProducts = await response.json();
		products = rawProducts
			.map((product) => {
				try {
					return {
						...product,
						specs:
							typeof product.specs === "string"
								? JSON.parse(product.specs)
								: product.specs,
						price: parseFloat(product.price),
					};
				} catch (parseError) {
					console.error("Error parsing product:", product, parseError);
					return null;
				}
			})
			.filter((product) => product !== null);

		if (products.length === 0) {
			throw new Error("No products found");
		}

		renderProducts();
	} catch (error) {
		console.error("Fetch error:", error);
		productsGrid.innerHTML = `
						<div class="col-span-5 text-center py-10">
							<h2 class="text-2xl font-bold text-gray-600 mb-4">
								Unable to Load Products
							</h2>
							<p class="text-gray-500">
								${error.message}
							</p>
							<p class="text-red-500 mt-2">
								Please check your backend connection and try again.
							</p>
						</div>
					`;
	}
}
// Function to add product to cart
async function addToCart(productId, quantity = 1) {
	// Ensure quantity is parsed as an integer
	quantity = parseInt(quantity, 10);

	// Check if user is logged in (assuming you store user info in localStorage)
	const userId = localStorage.getItem("userId");

	if (!userId) {
		// Show login prompt
		showCartMessage("Please log in to add items to cart", false);
		return;
	}

	try {
		const response = await fetch("http://localhost:3000/api/cart", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				user_id: userId,
				product_id: productId,
				quantity: quantity,
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Failed to add product to cart");
		}

		// Show success message
		showCartMessage(data.message, true);
	} catch (error) {
		console.error("Add to Cart Error:", error);
		showCartMessage(error.message, false);
	}
}

// Create a message display function
function showCartMessage(message, isSuccess) {
	// Create message element
	const messageDiv = document.createElement("div");
	messageDiv.style.position = "fixed";
	messageDiv.style.top = "20px";
	messageDiv.style.left = "50%";
	messageDiv.style.transform = "translateX(-50%)";
	messageDiv.style.padding = "15px";
	messageDiv.style.backgroundColor = isSuccess ? "#4CAF50" : "#f44336";
	messageDiv.style.color = "white";
	messageDiv.style.borderRadius = "5px";
	messageDiv.style.zIndex = "1000";
	messageDiv.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
	messageDiv.textContent = message;

	// Add to body
	document.body.appendChild(messageDiv);

	// Remove after 3 seconds
	setTimeout(() => {
		document.body.removeChild(messageDiv);
	}, 3000);
}

// Modify the Quick View Modal rendering to include Add to Cart functionality
function openQuickView(productId) {
	const product = products.find((p) => p.id === productId);

	if (product) {
		modalContent.innerHTML = `
            <div class="flex">
                <img 
                    src="${product.image}" 
                    alt="${product.name}" 
                    class="w-1/2 object-cover rounded-lg"
                >
                <div class="pl-6 w-1/2">
                    <h2 class="text-2xl font-bold mb-4">${product.name}</h2>
                    <p class="text-gray-600 mb-4">${product.fullDescription}</p>
                    
                    <div class="mb-4">
                        <h3 class="font-semibold text-lg mb-2">Specifications:</h3>
                        <ul class="space-y-1">
                            ${Object.entries(product.specs || {})
															.map(
																([key, value]) =>
																	`<li class="text-gray-700">
                                            <span class="font-medium">${key}:</span> ${value}
                                        </li>`
															)
															.join("")}
                        </ul>
                    </div>
                    
                    <div class="flex justify-between items-center mt-6">
                        <span class="text-2xl font-bold text-blue-600">
                            $${parseFloat(product.price).toFixed(2)}
                        </span>
                        <div class="flex items-center space-x-4">
                            <input 
                                type="number" 
                                min="1" 
                                value="1" 
                                id="quantityInput" 
                                class="w-16 px-2 py-1 border rounded"
                            >
                            <button 
                                onclick="addToCart(${
																	product.id
																}, document.getElementById('quantityInput').value)" 
                                class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

		quickViewModal.classList.remove("hidden");
	}
}

// Also modify the product grid rendering to include Add to Cart
function renderProducts(filteredProducts = products) {
	if (!productsGrid) {
		console.error("Products grid element not found");
		return;
	}

	productsGrid.innerHTML = filteredProducts
		.map(
			(product) => `
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <img 
                        src="${product.image}" 
                        alt="${product.name}" 
                        class="w-full h-48 object-cover"
                    >
                    <div class="p-4">
                        <h3 class="text-lg font-semibold">${product.name}</h3>
                        <p class="text-gray-600 text-sm">${
													product.description
												}</p>
                        <div class="flex justify-between items-center mt-4">
                            <span class="text-xl font-bold text-blue-600">$${parseFloat(
															product.price
														).toFixed(2)}</span>
                            <div class="flex space-x-2">
                                <button 
                                    onclick="openQuickView(${product.id})" 
                                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                    Quick View
                                </button>
                                <button 
                                    onclick="addToCart(${product.id})" 
                                    class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `
		)
		.join("");
}

// Initialize the application
function init() {
	fetchProducts()
		.then(() => {
			setupFilterListeners();
		})
		.catch((error) => {
			console.error("Initialization error:", error);
		});
}

// Call init when the page loads
document.addEventListener("DOMContentLoaded", init);
