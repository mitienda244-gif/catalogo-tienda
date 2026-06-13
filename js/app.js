// js/app.js
// Módulo principal del catálogo mayorista

// ----- Variables globales -----
let cart = [];              // Array con los items del carrito
let allProducts = [];       // Array con todos los productos cargados desde JSON

// ----- DOM elementos -----
const productsContainer = document.getElementById('products-container');
const productsFoundSpan = document.getElementById('products-found');
const cartItemsList = document.getElementById('cart-items-list');
const orderForm = document.getElementById('order-form');
const hiddenCartDetails = document.getElementById('hidden-cart-details');
const cartCountBtn = document.getElementById('cart-count-btn');
const summaryQty = document.getElementById('summary-qty');
const summaryTotal = document.getElementById('summary-total');

// ----- Funciones principales -----

// Cargar productos al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    attachCategoryFilters();
    checkSuccessMessage();
    attachFormSubmitValidation();
    attachNetlifyAuth();
    attachGlobalClickEvents(); // Nueva función para delegar eventos
});

// Carga los productos desde productos.json
async function loadProducts() {
    try {
        const response = await fetch(`productos.json?nocache=${Date.now()}`);
        if (!response.ok) throw new Error('No se pudo cargar productos.json');
        const data = await response.json();
        allProducts = Array.isArray(data) ? data : (data.productos || []);
        renderProducts(allProducts);
    } catch (error) {
        console.error('Error cargando productos:', error);
        allProducts = [];
        renderProducts(allProducts);
    }
}

// Renderiza los productos en el contenedor
function renderProducts(products) {
    productsContainer.innerHTML = '';
    productsFoundSpan.innerText = products.length;

    if (products.length === 0) {
        productsContainer.innerHTML = '<p class="col-span-full text-center py-12 text-gray-500 font-light">No hay productos en esta categoría.</p>';
        return;
    }

    products.forEach(prod => {
        const talles = prod.talles ? prod.talles.split(',').map(t => t.trim()) : [];
        const colores = prod.colores ? prod.colores.split(',').map(c => c.trim()) : [];

        const card = document.createElement('div');
        card.className = 'bg-black/30 border border-white/10 rounded-2xl p-4 transition-all card-subtle';
        card.innerHTML = `
            <div class="overflow-hidden rounded-xl bg-black/50 h-48 flex items-center justify-center mb-4">
                <img src="${prod.imagen}" alt="${prod.titulo}" class="w-full h-full object-cover" loading="lazy">
            </div>
            <h4 class="font-medium text-white">${prod.titulo}</h4>
            <p class="text-blue-400 text-sm font-light mt-1">$${parseInt(prod.precio).toLocaleString('es-AR')} <span class="text-gray-500 text-xs">c/u mayorista</span></p>
            <div class="grid grid-cols-2 gap-2 mt-4 mb-4">
                <div>
                    <label class="text-[10px] uppercase tracking-wider text-gray-500 font-light">Talle</label>
                    <select id="size-${prod.id}" class="w-full bg-black/60 border border-white/10 rounded-lg text-xs p-2 text-white">
                        ${talles.map(t => `<option>${t}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="text-[10px] uppercase tracking-wider text-gray-500 font-light">Color</label>
                    <select id="color-${prod.id}" class="w-full bg-black/60 border border-white/10 rounded-lg text-xs p-2 text-white">
                        ${colores.map(c => `<option>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="col-span-2">
                    <label class="text-[10px] uppercase tracking-wider text-gray-500 font-light">Cantidad</label>
                    <input type="number" id="qty-${prod.id}" value="1" min="1" class="w-full bg-black/60 border border-white/10 rounded-lg text-xs p-2 text-white text-center">
                </div>
            </div>
            <button data-id="${prod.id}" data-titulo="${prod.titulo.replace(/"/g, '&quot;')}" data-precio="${prod.precio}" class="btn-agregar w-full bg-white/5 hover:bg-blue-600/80 text-white text-sm font-light py-2 rounded-xl transition-all">
                + Agregar al pedido
            </button>
        `;
        productsContainer.appendChild(card);
    });
}

// Delegación de eventos: esta función hace que el botón +Agregar funcione siempre
function attachGlobalClickEvents() {
    productsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-agregar')) {
            const id = e.target.dataset.id;
            const title = e.target.dataset.titulo;
            const price = e.target.dataset.precio;
            addToOrder(id, title, price);
        }
    });
}

// Agrega un producto al carrito
function addToOrder(id, title, price) {
    const sizeSelect = document.getElementById(`size-${id}`);
    const colorSelect = document.getElementById(`color-${id}`);
    const qtyInput = document.getElementById(`qty-${id}`);
    
    const size = sizeSelect ? sizeSelect.value : '';
    const color = colorSelect ? colorSelect.value : '';
    let qty = parseInt(qtyInput ? qtyInput.value : '1');
    if (isNaN(qty) || qty < 1) qty = 1;

    const existingIndex = cart.findIndex(item => item.id === id && item.size === size && item.color === color);
    if (existingIndex > -1) {
        cart[existingIndex].qty += qty;
    } else {
        cart.push({ id, title, price, size, color, qty });
    }

    if (qtyInput) qtyInput.value = '1';
    updateCartUI();
}

// Actualiza la interfaz del carrito
function updateCartUI() {
    let totalQty = 0;
    let totalPrice = 0;
    let details = '';

    if (cart.length === 0) {
        cartItemsList.innerHTML = `<div class="text-center py-8 text-gray-500"><p class="text-sm font-light">Tu carrito está vacío.</p></div>`;
        orderForm.classList.add('hidden');
        cartCountBtn.innerText = '0';
        summaryQty.innerText = '0';
        summaryTotal.innerHTML = '$0';
        return;
    }

    cartItemsList.innerHTML = '';
    orderForm.classList.remove('hidden');

    cart.forEach((item, index) => {
        const subtotal = item.price * item.qty;
        totalQty += item.qty;
        totalPrice += subtotal;
        details += `- ${item.qty} x "${item.title}" (Talle: ${item.size}, Color: ${item.color}) = $${subtotal.toLocaleString('es-AR')}\n`;

        const div = document.createElement('div');
        div.className = 'flex justify-between items-center bg-white/5 p-3 rounded-xl text-xs';
        div.innerHTML = `
            <div>
                <p class="font-medium text-white">${item.title}</p>
                <p class="text-gray-400 font-light">${item.size} | ${item.color} | x${item.qty}</p>
                <p class="text-blue-400">$${subtotal.toLocaleString('es-AR')}</p>
            </div>
            <button onclick="removeFromCart(${index})" class="text-gray-500 hover:text-red-400"><i class="fa-regular fa-trash-can"></i></button>
        `;
        cartItemsList.appendChild(div);
    });

    if (hiddenCartDetails) hiddenCartDetails.value = details;
    cartCountBtn.innerText = totalQty;
    summaryQty.innerText = totalQty;
    summaryTotal.innerHTML = `$${totalPrice.toLocaleString('es-AR')}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function attachCategoryFilters() {
    const catBtns = document.querySelectorAll('.cat-btn');
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => {
                b.classList.remove('active', 'bg-blue-600/80', 'text-white');
                b.classList.add('bg-white/5', 'text-gray-300');
            });
            btn.classList.add('active', 'bg-blue-600/80', 'text-white');
            const cat = btn.dataset.cat;
            renderProducts(cat === 'todos' ? allProducts : allProducts.filter(p => p.categoria?.toLowerCase() === cat));
        });
    });
}

function checkSuccessMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'success') {
        alert('¡Pedido enviado correctamente! Te contactaremos pronto.');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function attachFormSubmitValidation() {
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            if (cart.length === 0) {
                e.preventDefault();
                alert('Agregá productos al pedido antes de enviar.');
            }
        });
    }
}

function attachNetlifyAuth() {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on('init', user => {
            if (!user) {
                window.netlifyIdentity.on('login', () => { document.location.href = '/admin/'; });
            }
        });
    }
}

window.removeFromCart = removeFromCart;
