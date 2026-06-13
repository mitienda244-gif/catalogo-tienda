// js/app.js
// Módulo principal del catálogo mayorista

// ----- Variables globales -----

let cart = [];
let allProducts = [];

// DOM elements
const productsContainer = document.getElementById('products-container');
const productsFoundSpan = document.getElementById('products-found');
const cartItemsList = document.getElementById('cart-items-list');
const orderForm = document.getElementById('order-form');
const hiddenCartDetails = document.getElementById('hidden-cart-details');
const cartCountBtn = document.getElementById('cart-count-btn');
const summaryQty = document.getElementById('summary-qty');
const summaryTotal = document.getElementById('summary-total');

document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    attachCategoryFilters();
    checkSuccessMessage();
    attachFormSubmitValidation();
    attachNetlifyAuth();
});

async function loadProducts() {
    try {
        const res = await fetch(`productos.json?nocache=${Date.now()}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        allProducts = Array.isArray(data) ? data : (data.productos || []);
        renderProducts(allProducts);
    } catch (error) {
        allProducts = [{
            id: 'demo-1',
            titulo: 'Zapatilla Urbana Demo',
            precio: '28500',
            imagen: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
            talles: '38,39,40,41,42',
            colores: 'Negro, Blanco, Gris',
            categoria: 'urbano'
        }];
        renderProducts(allProducts);
    }
}

function renderProducts(products) {
    productsContainer.innerHTML = '';
    productsFoundSpan.innerText = products.length;
    if (!products.length) {
        productsContainer.innerHTML = '<p class="col-span-full text-center py-12 text-gray-500 font-light">No hay productos en esta categoría.</p>';
        return;
    }
    products.forEach(p => {
        const talles = p.talles?.split(',').map(t=>t.trim()) || [];
        const colores = p.colores?.split(',').map(c=>c.trim()) || [];
        const card = document.createElement('div');
        card.className = 'bg-black/30 border border-white/10 rounded-2xl p-4 transition-all card-subtle';
        card.innerHTML = `
            <div class="overflow-hidden rounded-xl bg-black/50 h-48 flex items-center justify-center mb-4">
                <img src="${p.imagen}" alt="${p.titulo}" class="w-full h-full object-cover" loading="lazy">
            </div>
            <h4 class="font-medium text-white">${p.titulo}</h4>
            <p class="text-blue-400 text-sm font-light mt-1">$${parseInt(p.precio).toLocaleString('es-AR')} <span class="text-gray-500 text-xs">c/u mayorista</span></p>
            <div class="grid grid-cols-2 gap-2 mt-4 mb-4">
                <div>
                    <label class="text-[10px] uppercase tracking-wider text-gray-500 font-light">Talle</label>
                    <select id="size-${p.id}" class="w-full bg-black/60 border border-white/10 rounded-lg text-xs p-2 text-white">
                        ${talles.map(t => `<option>${t}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="text-[10px] uppercase tracking-wider text-gray-500 font-light">Color</label>
                    <select id="color-${p.id}" class="w-full bg-black/60 border border-white/10 rounded-lg text-xs p-2 text-white">
                        ${colores.map(c => `<option>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="col-span-2">
                    <label class="text-[10px] uppercase tracking-wider text-gray-500 font-light">Cantidad</label>
                    <input type="number" id="qty-${p.id}" value="1" min="1" class="w-full bg-black/60 border border-white/10 rounded-lg text-xs p-2 text-white text-center">
                </div>
            </div>
            <button onclick="addToOrder('${p.id}', '${p.titulo.replace(/'/g, "\\'")}', ${p.precio})" class="w-full bg-white/5 hover:bg-blue-600/80 text-white text-sm font-light py-2 rounded-xl transition-all">
                + Agregar al pedido
            </button>
        `;
        productsContainer.appendChild(card);
    });
}

function addToOrder(id, title, price) {
    const size = document.getElementById(`size-${id}`).value;
    const color = document.getElementById(`color-${id}`).value;
    let qty = parseInt(document.getElementById(`qty-${id}`).value);
    if (isNaN(qty) || qty < 1) qty = 1;
    const existing = cart.find(i => i.id === id && i.size === size && i.color === color);
    if (existing) existing.qty += qty;
    else cart.push({ id, title, price, size, color, qty });
    document.getElementById(`qty-${id}`).value = 1;
    updateCartUI();
}

function updateCartUI() {
    let totalQty = 0, totalPrice = 0, details = '';
    if (!cart.length) {
        cartItemsList.innerHTML = `<div class="text-center py-8 text-gray-500"><i class="fa-regular fa-cart-shopping text-2xl mb-2 block"></i><p class="text-sm font-light">Tu carrito está vacío.</p></div>`;
        orderForm.classList.add('hidden');
        cartCountBtn.innerText = '0';
        summaryQty.innerText = '0';
        summaryTotal.innerHTML = '$0';
        return;
    }
    cartItemsList.innerHTML = '';
    orderForm.classList.remove('hidden');
    cart.forEach((item, idx) => {
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
            <button onclick="removeFromCart(${idx})" class="text-gray-500 hover:text-red-400"><i class="fa-regular fa-trash-can"></i></button>
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
            if (cat === 'todos') renderProducts(allProducts);
            else {
                const filtered = allProducts.filter(p => p.categoria?.toLowerCase() === cat);
                renderProducts(filtered);
            }
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
        orderForm.addEventListener('submit', async (e) => {
            if (cart.length === 0) {
                e.preventDefault();
                alert('Agregá productos al pedido antes de enviar.');
                return;
            }
            // Preparar objeto pedido para guardar localmente
            const nombre = document.querySelector('input[name="Nombre_Cliente"]')?.value || '';
            const telefono = document.querySelector('input[name="Telefono_Cliente"]')?.value || '';
            const email = document.querySelector('input[name="Email_Cliente"]')?.value || '';
            const pedido = {
                id: Date.now(),
                fecha: new Date().toLocaleString('es-AR'),
                cliente: { nombre, telefono, email },
                productos: cart.map(item => ({
                    titulo: item.title,
                    talle: item.size,
                    color: item.color,
                    cantidad: item.qty,
                    precio_unitario: item.price,
                    subtotal: item.price * item.qty
                })),
                total: cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
                estado: 'pendiente'
            };
            guardarPedidoLocal(pedido);
            // El formulario continuará enviándose a FormSubmit
        });
    }
}

function guardarPedidoLocal(pedido) {
    let pedidos = JSON.parse(localStorage.getItem('pedidos_mi_tienda') || '[]');
    pedidos.push(pedido);
    localStorage.setItem('pedidos_mi_tienda', JSON.stringify(pedidos));
}

function attachNetlifyAuth() {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on('init', user => {
            if (!user) {
                window.netlifyIdentity.on('login', () => document.location.href = '/admin/');
            }
        });
    }
}

// Exponer funciones globales
window.addToOrder = addToOrder;
window.removeFromCart = removeFromCart;
