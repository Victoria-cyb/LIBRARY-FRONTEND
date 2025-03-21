const API_BASE = 'https://library-api-s5aw.onrender.com';

// Add this new function
function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      const decoded = jwt_decode(token); // Add jwt-decode library: <script src="https://unpkg.com/jwt-decode@3.1.2/build/jwt-decode.js"></script>
      localStorage.setItem('userId', decoded.userId);
      localStorage.setItem('username', decoded.name);
      window.location.hash = '#/dashboard'; // Redirect to dashboard
      window.history.replaceState({}, document.title, window.location.pathname + '#/dashboard'); // Clean URL
    }
  }

const views = {
    home: document.getElementById('viewHome'),
    books: document.getElementById('viewBooks'),
    return: document.getElementById('viewReturn'),
    borrow: document.getElementById('viewBorrow'),
    login: document.getElementById('viewAuth'),
    dashboard: document.getElementById('viewDashboard'),
    register: document.getElementById('viewRegister'),
    details: document.getElementById('viewDetails')
};

const elements = {
    loader: document.getElementById('loader'),
    logoutBtn: document.getElementById('logoutBtn'),
    userBanner: document.getElementById('userBanner'),
    navLogin: document.getElementById('navLogin'),
    navRegister: document.getElementById('navRegister')
};

// Initialization
window.onload = () => {
    checkAuth();
    handleOAuthCallback(); // Check for token on load
    route();
};

window.addEventListener('hashchange', route);

// Routing
function route() {
    const path = window.location.hash.slice(2) || '';
    hideAllViews();
    switch (path) {
        case 'books': showBooks(); break;
        case 'borrow': showBorrow(); break;
        case 'return': showReturn(); break;
        case 'login': showAuth(); break;
        case 'register': showRegister(); break;
        case 'dashboard': showDashboard(); break;
        default: showHome(); break;
    }
}

// Utility Functions
function hideAllViews() {
    Object.values(views).forEach(view => view.classList.remove('active'));
}

function checkAuth() {
    const isAuthenticated = !!localStorage.getItem('token');
    elements.logoutBtn.style.display = isAuthenticated ? 'inline' : 'none';
    elements.navLogin.style.display = isAuthenticated ? 'none' : 'inline';
    elements.navRegister.style.display = isAuthenticated ? 'none' : 'inline';
    if (isAuthenticated) showUserBanner();
    else elements.userBanner.style.display = 'none';
}

function showUserBanner() {
    // const userId = localStorage.getItem('userId');
    // if (userId) {
    //     elements.userBanner.innerHTML = `Logged in as <strong>${userId}</strong>`;
    //     elements.userBanner.style.display = 'block';
    // }
    const username = localStorage.getItem('username'); // Get username instead
    if (username) {
        elements.userBanner.innerHTML = `Logged in as <strong>${username}</strong>`;
        elements.userBanner.style.display = 'block';
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// API Request Handler
async function apiRequest(endpoint, method = 'GET', data = null) {
    elements.loader.style.display = 'flex';
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        };
        if (data) options.body = JSON.stringify(data);

        const res = await fetch(`${API_BASE}${endpoint}`, options);
        const responseData = await res.json();
        elements.loader.style.display = 'none';
        
        if (!res.ok) throw new Error(responseData.message || 'Request failed');
        return responseData;
    } catch (err) {
        elements.loader.style.display = 'none';
        showToast(err.message || 'Network error', 'error');
        throw err;
    }
}

// View Functions
function showHome() {
    views.home.classList.add('active');
    views.home.innerHTML = `
        <h2>Welcome to MyLibrary 📚</h2>
        <p>Manage your library effortlessly. Borrow, Return & Explore books with ease!</p>
        <button onclick="window.location.hash = '#/books'">Browse Books</button>
    `;
}

async function showBooks() {
    views.books.classList.add('active');
    try {
        const books = await apiRequest('/api/books');
        console.log('Fetched books:', books);
        views.books.innerHTML = `
            <h2>Available Books</h2>
            <div class="book-grid">
                ${books.map(book => `
                    <div class="book-card">
                        <h4>${book.title}</h4>
                        <p>Author: ${book.author}</p>
                        <p>ID: ${book._id}</p>
                        <p>Copies: ${book.copiesAvailable !== undefined ? book.copiesAvailable : 'N/A'}</p>
                        <button onclick="prefillBorrow('${book._id}')" ${book.copiesAvailable <= 0 ? 'disabled' : ''}>Borrow</button>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {}
}

function showBorrow() {
    views.borrow.classList.add('active');
    views.borrow.innerHTML = `
        <h2>Borrow a Book</h2>
        <form class="borrow-form" onsubmit="borrowBook(event)">
            <input type="text" id="borrowBookId" placeholder="Enter Book ID" required>
            <input type="text" id="userId" placeholder="Enter Your User ID" required>
            <input type="date" id="dueDate" required>
            <button type="submit">Borrow Book</button>
        </form>
        <div id="borrowResult"></div>
    `;
}

function showReturn() {
    views.return.classList.add('active');
    views.return.innerHTML = `
        <h2>Return a Book</h2>
        <form class="return-form" onsubmit="returnBook(event)">
            <input type="text" id="returnBookId" placeholder="Enter Book ID" required>
            <input type="text" id="returnBorrowId" placeholder="Enter Borrow ID" required>
            <input type="text" id="userId" placeholder="Enter Your User ID" required>
            <button type="submit">Return Book</button>
        </form>
        <div id="returnResult"></div>
    `;

    const bookIdInput = document.getElementById('returnBookId');
    const borrowIdInput = document.getElementById('returnBorrowId');
    const userIdInput = document.getElementById('userId');
    
    bookIdInput.addEventListener('change', () => {
        const bookId = bookIdInput.value;
        const storedBorrowId = localStorage.getItem(`borrowId_${bookId}`);
        if (storedBorrowId) {
            borrowIdInput.value = storedBorrowId;
        }
    });
    
    userIdInput.value = localStorage.getItem('userId') || '';
}

function showAuth() {
    if (localStorage.getItem('token')) {
        window.location.hash = '#/books';
        return;
    }
    views.login.classList.add('active');
    views.login.innerHTML = `
        <h2>Login</h2>
        <form class="auth-form" onsubmit="login(event)">
            <input type="email" id="loginEmail" placeholder="Email" required>
            <input type="password" id="loginPassword" placeholder="Password" required>
            <button type="submit">Login</button>
            <button onclick="window.location.href='${API_BASE}/api/auth/google'">Login with Google</button>
        </form>
    `;
}

function showRegister() {
    views.register.classList.add('active');
    views.register.innerHTML = `
        <h2>Register</h2>
        <form class="auth-form" onsubmit="register(event)">
            <input type="text" id="registerName" placeholder="Name" required>
            <input type="email" id="registerEmail" placeholder="Email" required>
            <input type="password" id="registerPassword" placeholder="Password" required>
            <button type="submit">Register</button>
        </form>
    `;
}

async function showDashboard() {
    views.dashboard.classList.add('active');
    const borrowedBooks = [];
    
    // Fetch all books to match with stored borrow IDs
    try {
        const books = await apiRequest('/api/books');
        console.log('Books for dashboard:', books);

        // check localstorage for borrowed books
        books.forEach(book => {
            const borrowDetailsStr = localStorage.getItem(`borrowDetails_${book._id}`);
            if (borrowDetailsStr) {
               const borrowDetails = JSON.parse(borrowDetailsStr);
               console.log(`Borrow details for ${book._id}:`, borrowDetails);
               borrowedBooks.push(borrowDetails);
            }
        });
    } catch (err) {
        console.error('Error fetching books for dashboard:', err);
    }

    views.dashboard.innerHTML = `
        <h2>Your Dashboard</h2>
        <h3>Borrowed Books</h3>
        ${borrowedBooks.length > 0 ? `
            <div class="borrowed-grid">
                ${borrowedBooks.map(borrow => `
                    <div class="borrow-card">
                        <h4>${borrow.title}</h4>
                        <p>Author: ${borrow.author}</p>
                        <p>Book ID: ${borrow.bookId}</p>
                        <p>Borrow ID: ${borrow.borrowId || 'Not available'}</p>
                        <button onclick="prefillReturn('${borrow.bookId}', '${borrow.borrowId || ''}')">Return</button>
                    </div>
                `).join('')}
            </div>
        ` : '<p>No books borrowed yet.</p>'}
    `;
}

// Event Handlers
async function login(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        const data = await apiRequest('/api/user/login', 'POST', { email, password });
        console.log('Login response', data);
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', data.username || data.name);
        showToast('Login Successful!', 'success');
        checkAuth();
        window.location.hash = '#/books';
    } catch (err) {}
}

async function register(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    try {
        await apiRequest('/api/user/register', 'POST', { name, email, password });
        showToast('Registration Successful! Please login.', 'success');
        window.location.hash = '#/login';
    } catch (err) {}
}

async function borrowBook(e) {
    e.preventDefault();
    const bookId = document.getElementById('borrowBookId').value;
    const userId = document.getElementById('userId').value;
    const dueDate = document.getElementById('dueDate').value;
    try {
        const data = await apiRequest(`/api/borrow/${bookId}`, 'POST', { userId, dueDate });
        console.log('Borrow response:', data);
        const borrowId = data.borrowId || data._id || data.id || (data.borrow && data.borrow._id) || 'unknown';
        console.log('Extracted borrowId:', borrowId);

        const book = await apiRequest(`/api/books/${bookId}`);
        const borrowDetails = {
            bookId: bookId,
            title: book.title,
            author: book.author,
            borrowId: borrowId
        };
        console.log('Storing borrow details:', borrowDetails);
        localStorage.setItem(`borrowDetails_${bookId}`, JSON.stringify(borrowDetails));

        showToast('Book borrowed successfully!', 'success');
        e.target.reset();
        window.location.hash = '#/dashboard';
        showDashboard();
    } catch (err) {
        console.error('Borrow error:', err.message);
        showToast(`Failed to borrow book: ${err.message}`, 'error');
    }
}

async function returnBook(e) {
    e.preventDefault();
    const bookId = document.getElementById('returnBookId').value;
    const borrowId = document.getElementById('returnBorrowId').value;
    const userId = document.getElementById('userId').value;
    try {
        await apiRequest(`/api/borrow/return/${bookId}`, 'POST', { borrowId, userId });
        showToast('Book returned successfully!', 'success');
        document.getElementById('returnResult').innerHTML = 'Return completed';
        
        // Remove borrow details from localStorage
        localStorage.removeItem(`borrowDetails_${bookId}`);
        
        e.target.reset();
        window.location.hash = '#/dashboard';
        showDashboard();
    } catch (err) {
        console.error('Return error:', err.message);
        showToast(`Failed to return book: ${err.message}`, 'error');
    }
}

function prefillBorrow(bookId) {
    window.location.hash = '#/borrow';
    setTimeout(() => {
        document.getElementById('borrowBookId').value = bookId;
        document.getElementById('userId').value = localStorage.getItem('userId') || '';
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('dueDate').value = tomorrow.toISOString().split('T')[0];
    }, 100);
}

function prefillReturn(bookId, borrowId) {
    window.location.hash = '#/return';
    setTimeout(() => {
        document.getElementById('returnBookId').value = bookId;
        document.getElementById('returnBorrowId').value = borrowId;
        document.getElementById('userId').value = localStorage.getItem('userId') || '';
    }, 100);
}

function logout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    checkAuth();
    showToast('Logged out successfully!', 'success');
    window.location.hash = '#/login';
}

elements.logoutBtn.addEventListener('click', logout);