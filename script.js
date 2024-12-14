// script for navbar and header
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const mobileMenu = document.getElementById("mobileMenu");
const closeMobileMenu = document.getElementById("closeMobileMenu");

mobileMenuToggle.addEventListener("click", () => {
	mobileMenu.classList.toggle("hidden");
});

closeMobileMenu.addEventListener("click", () => {
	mobileMenu.classList.add("hidden");
});

const profileToggle = document.getElementById("profileToggle");
const profileDropdown = document.getElementById("profileDropdown");

profileToggle.addEventListener("click", () => {
	profileDropdown.classList.toggle("hidden");
});

window.addEventListener("click", (event) => {
	if (!event.target.closest("#profileToggle")) {
		profileDropdown.classList.add("hidden");
	}
});

// Toggle profile dropdown
document.getElementById("profileToggle").addEventListener("click", function () {
	const dropdown = document.getElementById("profileDropdown");
	dropdown.classList.toggle("hidden");
});

// Close dropdown if clicked outside
window.addEventListener("click", function (event) {
	const dropdown = document.getElementById("profileDropdown");
	if (!event.target.closest("#profileToggle")) {
		dropdown.classList.add("hidden");
	}
});
