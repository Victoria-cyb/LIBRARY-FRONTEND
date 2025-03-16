const apiUrl = "https://library-api-s5aw.onrender.com"; // Change this to match your backend URL

// 🔑 Handle Login & Registration UI
function showLoginForm() {
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("registerForm").style.display = "none";
}

function showRegisterForm() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
}

// 🔑 User Registration
async function registerUser() {
    const name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    const response = await fetch(`${apiUrl}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    alert(data.message);
    if (response.ok) showLoginForm();
}

// 🔑 User Login
async function loginUser() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const response = await fetch(`${apiUrl}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
        localStorage.setItem("token", data.token);
        alert("Login successful!");
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("logoutBtn").style.display = "inline";
        fetchBooks();
    } else {
        alert(data.message);
    }
}

// 🚀 Fetch Books
async function fetchBooks() {
    const response = await fetch(`${apiUrl}/books`);
    const books = await response.json();
    displayBooks(books);
}

// 📌 Display Books
function displayBooks(books) {
    const bookList = document.getElementById("bookList");
    bookList.innerHTML = "";
    
    books.forEach(book => {
        const bookCard = document.createElement("div");
        bookCard.classList.add("book-card");
        bookCard.innerHTML = `
            <h3>${book.title}</h3>
            <p>📖 Author: ${book.author}</p>
            <p>📌 ID: ${book._id}</p>
            <button onclick="viewBookDetails('${book._id}')">📚 View Details</button>
        `;
        bookList.appendChild(bookCard);
    });
}

// 📖 View Book Details
async function viewBookDetails(bookId) {
    const response = await fetch(`${apiUrl}/books/${bookId}`);
    const book = await response.json();

    document.getElementById("bookTitle").innerText = book.title;
    document.getElementById("bookTitle").dataset.bookId = book._id;
    document.getElementById("bookAuthor").innerText = book.author;
    document.getElementById("bookDescription").innerText = book.description;
    document.getElementById("bookCopies").innerText = book.copiesAvailable;

    document.getElementById("bookList").style.display = "none";
    document.getElementById("bookDetails").style.display = "block";
}

// 📖 Borrow a Book
async function borrowBook() {
    const bookId = document.getElementById("bookTitle").dataset.bookId;
    const response = await fetch(`${apiUrl}/borrow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId })
    });

    const data = await response.json();
    alert(data.message);
    fetchBooks();
}

// ⬅ Go Back
function goBack() {
    document.getElementById("bookList").style.display = "block";
    document.getElementById("bookDetails").style.display = "none";
}

fetchBooks();
