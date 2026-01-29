// ===== CONFIGURACIÓN INICIAL =====
const ADMIN_PASSWORD = "admin123";
let isAdminLogged = false;
let products = [];
let orders = [];
let storeConfig = {};
let editingProductId = null;

// ===== FUNCIONES INICIALES =====
document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
    checkLoginStatus();
    updateAdminStatus();
});

function loadAllData() {
    // Cargar productos
    try {
        fetch('productos.json')
            .then(response => response.json())
            .then(data => {
                products = data.products || [];
                renderProductsList();
            })
            .catch(error => {
                console.error('Error cargando productos:', error);
                showMessage('Error cargando productos. Usando datos locales.', 'danger');
                loadProductsFromLocal();
            });
    } catch (error) {
        loadProductsFromLocal();
    }
    
    // Cargar configuración
    storeConfig = JSON.parse(localStorage.getItem('tiendaConfig')) || {
        storeName: "TIENDA MAYORISTA",
        storeEmail: "mitienda244@gmail.com",
        phone: "undefined",
        shippingCost: 8000,
        shippingFreeMin: 200000,
        minOrder: 1
    };
    
    // Cargar pedidos
    orders = JSON.parse(localStorage.getItem('tiendaOrders')) || [];
    
    // Cargar configuración en formularios
    loadConfigForm();
}

function loadProductsFromLocal() {
    products = JSON.parse(localStorage.getItem('tiendaProducts')) || [
        {
            id: 1,
            codigo: "NIKE-AM270-001",
            nombre: "Zapatillas Nike Air Max 270",
            marca: "Nike",
            modelo: "Air Max 270",
            color: "Negro/Blanco",
            talle: "40",
            stock: 150,
            precio: 85000,
            imagen: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            categoria: "Deportivas",
            descripcion: "Zapatillas deportivas con tecnología Air Max"
        }
    ];
    renderProductsList();
}

function saveAllData() {
    localStorage.setItem('tiendaProducts', JSON.stringify(products));
    localStorage.setItem('tiendaOrders', JSON.stringify(orders));
    localStorage.setItem('tiendaConfig', JSON.stringify(storeConfig));
}

// ===== AUTENTICACIÓN =====
function checkLoginStatus() {
    const savedLogin = localStorage.getItem('tiendaAdminLogged');
    if (savedLogin === 'true') {
        const lastLogin = parseInt(localStorage.getItem('tiendaLastLogin') || '0');
        const now = Date.now();
        
        // Sesión válida por 8 horas
        if (now - lastLogin < 8 * 60 * 60 * 1000) {
            isAdminLogged = true;
            showAdminTabs();
        } else {
            logoutAdmin();
        }
    }
}

function loginAdmin() {
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    if (password === ADMIN_PASSWORD) {
        isAdminLogged = true;
        localStorage.setItem('tiendaAdminLogged', 'true');
        localStorage.setItem('tiendaLastLogin', Date.now().toString());
        
        errorDiv.style.display = 'none';
        document.getElementById('adminPassword').value = '';
        
        showMessage('✅ Sesión iniciada correctamente', 'success');
        showAdminTabs();
        switchTab('products');
        updateAdminStatus();
    } else {
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Contraseña incorrecta. La contraseña predeterminada es: admin123';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

function logoutAdmin() {
    isAdminLogged = false;
    localStorage.removeItem('tiendaAdminLogged');
    localStorage.removeItem('tiendaLastLogin');
    
    showMessage('Sesión cerrada', 'info');
    switchTab('login');
    updateAdminStatus();
}

function updateAdminStatus() {
    const statusDiv = document.getElementById('adminStatus');
    if (isAdminLogged) {
        statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> Autenticado`;
        statusDiv.style.background = 'rgba(46, 125, 50, 0.2)';
        statusDiv.style.color = '#2e7d32';
    } else {
        statusDiv.innerHTML = `<i class="fas fa-times-circle"></i> No autenticado`;
        statusDiv.style.background = 'rgba(211, 47, 47, 0.2)';
        statusDiv.style.color = '#d32f2f';
    }
}

// ===== NAVEGACIÓN =====
function switchTab(tabName) {
    // Actualizar pestañas activas
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activar la pestaña solicitada
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Si no está logueado, solo mostrar login
    if (!isAdminLogged && tabName !== 'login') {
        showMessage('Debe iniciar sesión primero', 'danger');
        switchTab('login');
        return;
    }
    
    // Actualizar datos según la pestaña
    if (tabName === 'products') {
        renderProductsList();
    } else if (tabName === 'orders') {
        renderOrdersList();
    } else if (tabName === 'config') {
        loadConfigForm();
    }
}

function showAdminTabs() {
    document.querySelectorAll('.tab-btn').forEach((btn, index) => {
        if (index > 0) { // Todas excepto login
            btn.style.display = 'flex';
        }
    });
}

// ===== GESTIÓN DE PRODUCTOS =====
function showAddProductForm() {
    editingProductId = null;
    
    const formHTML = `
        <div class="product-form-grid">
            <div class="image-upload-container">
                <div class="image-preview" id="imagePreview">
                    <div style="text-align: center; color: #666;">
                        <i class="fas fa-image" style="font-size: 48px; margin-bottom: 10px;"></i>
                        <p>Vista previa de la imagen</p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button type="button" class="upload-btn" onclick="document.getElementById('productImageFile').click()">
                        <i class="fas fa-upload"></i> Subir Imagen
                    </button>
                    <button type="button" class="btn" onclick="showUrlInput()" style="background: #f0f0f0; color: #333;">
                        <i class="fas fa-link"></i> Usar URL
                    </button>
                </div>
                <input type="file" id="productImageFile" class="file-input" accept="image/*" onchange="previewUploadedImage(event)">
                <div id="urlInputContainer" style="display: none; margin-top: 10px;">
                    <input type="text" id="productImageUrl" class="form-control" placeholder="https://ejemplo.com/imagen.jpg">
                    <button type="button" class="btn btn-primary mt-10" onclick="previewImageFromUrl()" style="width: 100%; margin-top: 10px;">
                        <i class="fas fa-eye"></i> Previsualizar
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label>Código *</label>
                <input type="text" id="productCode" class="form-control" placeholder="NIKE-AM270-001" required>
            </div>
            
            <div class="form-group">
                <label>Nombre *</label>
                <input type="text" id="productName" class="form-control" placeholder="Zapatillas Nike Air Max 270" required>
            </div>
            
            <div class="form-group">
                <label>Marca *</label>
                <select id="productBrand" class="form-control" required>
                    <option value="">Seleccionar marca</option>
                    <option value="Nike">Nike</option>
                    <option value="Adidas">Adidas</option>
                    <option value="Puma">Puma</option>
                    <option value="Converse">Converse</option>
                    <option value="Vans">Vans</option>
                    <option value="Reebok">Reebok</option>
                    <option value="New Balance">New Balance</option>
                    <option value="Other">Otra</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Modelo *</label>
                <input type="text" id="productModel" class="form-control" placeholder="Air Max 270" required>
            </div>
            
            <div class="form-group">
                <label>Color *</label>
                <input type="text" id="productColor" class="form-control" placeholder="Negro/Blanco" required>
            </div>
            
            <div class="form-group">
                <label>Talle Base *</label>
                <select id="productSize" class="form-control" required>
                    <option value="35">35</option>
                    <option value="36">36</option>
                    <option value="37">37</option>
                    <option value="38">38</option>
                    <option value="39">39</option>
                    <option value="40">40</option>
                    <option value="41">41</option>
                    <option value="42">42</option>
                    <option value="43">43</option>
                    <option value="44">44</option>
                    <option value="45">45</option>
                    <option value="46">46</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Categoría *</label>
                <select id="productCategory" class="form-control" required>
                    <option value="Deportivas">Deportivas</option>
                    <option value="Running">Running</option>
                    <option value="Urbanas">Urbanas</option>
                    <option value="Casual">Casual</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Stock *</label>
                <input type="number" id="productStock" class="form-control" value="100" min="0" required>
            </div>
            
            <div class="form-group">
                <label>Precio ($) *</label>
                <input type="number" id="productPrice" class="form-control" placeholder="85000" min="0" required>
            </div>
            
            <div class="form-group" style="grid-column: span 2;">
                <label>Descripción</label>
                <textarea id="productDescription" class="form-control" rows="3" placeholder="Descripción del producto"></textarea>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
            <button class="btn btn-success" onclick="saveProduct()">
                <i class="fas fa-save"></i> Guardar Producto
            </button>
            <button class="btn" onclick="closeProductModal()" style="background: #f0f0f0; color: #333;">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
    `;
    
    document.getElementById('modalTitle').textContent = 'Nuevo Producto';
    document.getElementById('productFormContainer').innerHTML = formHTML;
    document.getElementById('productModal').classList.add('active');
}

function showUrlInput() {
    document.getElementById('urlInputContainer').style.display = 'block';
}

function previewUploadedImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imagePreview').innerHTML = 
                `<img src="${e.target.result}" alt="Vista previa" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
        };
        reader.readAsDataURL(file);
    }
}

function previewImageFromUrl() {
    const url = document.getElementById('productImageUrl').value;
    if (url) {
        document.getElementById('imagePreview').innerHTML = 
            `<img src="${url}" alt="Vista previa" style="max-width: 100%; max-height: 100%; object-fit: contain;" 
                  onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'">`;
    }
}

function saveProduct() {
    // Validar campos requeridos
    const requiredFields = ['productCode', 'productName', 'productBrand', 'productModel', 
                           'productColor', 'productPrice', 'productStock'];
    
    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            showMessage(`El campo ${field.previousElementSibling.textContent} es requerido`, 'danger');
            field.focus();
            return;
        }
    }
    
    // Obtener imagen
    const preview = document.getElementById('imagePreview');
    let imageUrl = '';
    
    if (preview.querySelector('img')) {
        imageUrl = preview.querySelector('img').src;
    }
    
    // Si no hay imagen, usar una por defecto
    if (!imageUrl || imageUrl.includes('fa-image')) {
        imageUrl = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
    }
    
    const productData = {
        id: editingProductId || Date.now(),
        codigo: document.getElementById('productCode').value.trim(),
        nombre: document.getElementById('productName').value.trim(),
        marca: document.getElementById('productBrand').value,
        modelo: document.getElementById('productModel').value.trim(),
        color: document.getElementById('productColor').value.trim(),
        talle: document.getElementById('productSize').value,
        categoria: document.getElementById('productCategory').value,
        stock: parseInt(document.getElementById('productStock').value),
        precio: parseInt(document.getElementById('productPrice').value),
        imagen: imageUrl,
        descripcion: document.getElementById('productDescription').value.trim() || 
                    `Zapatillas ${document.getElementById('productBrand').value} ${document.getElementById('productModel').value}`
    };
    
    if (editingProductId) {
        // Actualizar producto existente
        const index = products.findIndex(p => p.id === editingProductId);
        if (index !== -1) {
            products[index] = productData;
            showMessage('✅ Producto actualizado correctamente', 'success');
        }
    } else {
        // Agregar nuevo producto
        products.push(productData);
        showMessage('✅ Producto agregado correctamente', 'success');
    }
    
    // Guardar en localStorage
    localStorage.setItem('tiendaProducts', JSON.stringify(products));
    
    // Cerrar modal y actualizar lista
    closeProductModal();
    renderProductsList();
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    editingProductId = productId;
    
    // Mostrar el formulario primero
    showAddProductForm();
    
    // Llenar con datos del producto después de un pequeño delay
    setTimeout(() => {
        document.getElementById('productCode').value = product.codigo;
        document.getElementById('productName').value = product.nombre;
        document.getElementById('productBrand').value = product.marca;
        document.getElementById('productModel').value = product.modelo;
        document.getElementById('productColor').value = product.color;
        document.getElementById('productSize').value = product.talle;
        document.getElementById('productCategory').value = product.categoria;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productPrice').value = product.precio;
        document.getElementById('productDescription').value = product.descripcion;
        
        // Mostrar imagen
        if (product.imagen) {
            document.getElementById('imagePreview').innerHTML = 
                `<img src="${product.imagen}" alt="Vista previa" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
        }
        
        document.getElementById('modalTitle').textContent = 'Editar Producto';
    }, 100);
}

function deleteProduct(productId) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
        products = products.filter(p => p.id !== productId);
        localStorage.setItem('tiendaProducts', JSON.stringify(products));
        renderProductsList();
        showMessage('✅ Producto eliminado', 'success');
    }
}

function renderProductsList() {
    const container = document.getElementById('productsList');
    
    if (products.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 20px;"></i>
                <h3>No hay productos</h3>
                <p>Agregue su primer producto usando el botón "Agregar Nuevo Producto"</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    products.forEach(product => {
        html += `
            <div class="product-item">
                <div class="product-header">
                    <div class="product-code">${product.codigo}</div>
                    <div class="product-actions">
                        <button class="action-btn edit-btn" onclick="editProduct(${product.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
                
                <div style="display: flex; gap: 20px; margin-bottom: 15px;">
                    <div style="flex-shrink: 0;">
                        <img src="${product.imagen}" alt="${product.nombre}" 
                             style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;"
                             onerror="this.src='https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'">
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin-bottom: 10px;">${product.nombre}</h4>
                        <div class="product-details">
                            <div>
                                <span class="detail-label">Marca:</span>
                                <span class="detail-value">${product.marca}</span>
                            </div>
                            <div>
                                <span class="detail-label">Modelo:</span>
                                <span class="detail-value">${product.modelo}</span>
                            </div>
                            <div>
                                <span class="detail-label">Color:</span>
                                <span class="detail-value">${product.color}</span>
                            </div>
                            <div>
                                <span class="detail-label">Talle:</span>
                                <span class="detail-value">${product.talle}</span>
                            </div>
                            <div>
                                <span class="detail-label">Stock:</span>
                                <span class="detail-value">${product.stock} pares</span>
                            </div>
                            <div>
                                <span class="detail-label">Precio:</span>
                                <span class="detail-value">$${formatPrice(product.precio)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="color: #666; font-size: 14px;">
                    ${product.descripcion}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    editingProductId = null;
}

// ===== GESTIÓN DE PEDIDOS =====
function renderOrdersList() {
    const container = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 20px;"></i>
                <h3>No hay pedidos</h3>
                <p>Los pedidos enviados por los clientes aparecerán aquí</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por fecha (más recientes primero)
    const sortedOrders = [...orders].sort((a, b) => 
        new Date(b.fecha || b.date) - new Date(a.fecha || a.date)
    );
    
    let html = '';
    
    sortedOrders.forEach(order => {
        const orderDate = order.fecha || order.date || new Date().toISOString();
        const orderNumber = order.numero || order.id || 'N/A';
        const clientName = order.cliente?.nombre || order.nombre || 'Cliente';
        const total = order.total || order.monto || 0;
        const status = order.estado || order.status || 'pendiente';
        
        const statusClass = `status-${status}`;
        const statusText = status === 'pendiente' ? 'PENDIENTE' : 
                          status === 'confirmado' ? 'CONFIRMADO' : 'CANCELADO';
        
        html += `
            <div class="order-card" onclick="viewOrderDetails('${orderNumber}')">
                <div class="order-header">
                    <div class="order-number">${orderNumber}</div>
                    <div class="order-date">${new Date(orderDate).toLocaleDateString()}</div>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <strong>${clientName}</strong><br>
                    <small style="color: #666;">${order.cliente?.email || order.email || ''}</small>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="order-status ${statusClass}">${statusText}</span>
                    <div class="order-total">$${formatPrice(total)}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function viewOrderDetails(orderNumber) {
    const order = orders.find(o => 
        (o.numero === orderNumber) || (o.id === orderNumber) || 
        (o.numero && o.numero.toString() === orderNumber)
    );
    
    if (!order) {
        showMessage('Pedido no encontrado', 'danger');
        return;
    }
    
    const cliente = order.cliente || {};
    const productos = order.productos || [];
    
    let detailsHTML = `
        <div style="margin-bottom: 25px;">
            <h4><i class="fas fa-user"></i> Información del Cliente</h4>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                <p><strong>Nombre:</strong> ${cliente.nombre || 'No especificado'}</p>
                <p><strong>Email:</strong> ${cliente.email || 'No especificado'}</p>
                <p><strong>Teléfono:</strong> ${cliente.telefono || 'No especificado'}</p>
                <p><strong>Dirección:</strong> ${cliente.direccion || 'No especificada'}</p>
                <p><strong>Provincia:</strong> ${cliente.provincia || 'No especificada'}</p>
            </div>
        </div>
        
        <div style="margin-bottom: 25px;">
            <h4><i class="fas fa-box"></i> Productos del Pedido</h4>
    `;
    
    if (productos.length > 0) {
        detallesHTML += `
            <div style="max-height: 300px; overflow-y: auto; margin-top: 10px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Producto</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Talle</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Cantidad</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Precio</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        productos.forEach(item => {
            detailsHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">${item.nombre || 'Producto'}</td>
                    <td style="padding: 10px;">${item.talle || 'N/A'}</td>
                    <td style="padding: 10px;">${item.cantidad || 0}</td>
                    <td style="padding: 10px;">$${formatPrice(item.precio || 0)}</td>
                    <td style="padding: 10px;">$${formatPrice(item.total || 0)}</td>
                </tr>
            `;
        });
        
        detailsHTML += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        detailsHTML += `<p style="color: #666; margin-top: 10px;">No hay productos en este pedido</p>`;
    }
    
    // Calcular totales
    const subtotal = productos.reduce((sum, item) => sum + (item.total || 0), 0);
    const envio = order.envio || order.shipping || 0;
    const total = order.total || subtotal + envio;
    
    detailsHTML += `
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Subtotal:</span>
                <span>$${formatPrice(subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Envío:</span>
                <span>${envio === 0 ? 'GRATIS' : '$' + formatPrice(envio)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; padding-top: 10px; border-top: 2px solid #ddd;">
                <span>TOTAL:</span>
                <span>$${formatPrice(total)}</span>
            </div>
        </div>
        
        ${order.notas || order.comentarios ? `
            <div style="margin-bottom: 25px;">
                <h4><i class="fas fa-comment"></i> Notas</h4>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                    ${order.notas || order.comentarios}
                </div>
            </div>
        ` : ''}
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <button class="btn" onclick="updateOrderStatus('${orderNumber}', 'pendiente')" 
                    style="background: #ffb300; color: white;">
                <i class="fas fa-clock"></i> Pendiente
            </button>
            <button class="btn" onclick="updateOrderStatus('${orderNumber}', 'confirmado')" 
                    style="background: #2e7d32; color: white;">
                <i class="fas fa-check"></i> Confirmar
            </button>
            <button class="btn" onclick="updateOrderStatus('${orderNumber}', 'cancelado')" 
                    style="background: #d32f2f; color: white;">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
    `;
    
    document.getElementById('orderDetails').innerHTML = detailsHTML;
    document.getElementById('orderModal').classList.add('active');
}

function updateOrderStatus(orderNumber, newStatus) {
    const orderIndex = orders.findIndex(o => 
        (o.numero === orderNumber) || (o.id === orderNumber) || 
        (o.numero && o.numero.toString() === orderNumber)
    );
    
    if (orderIndex !== -1) {
        orders[orderIndex].estado = newStatus;
        localStorage.setItem('tiendaOrders', JSON.stringify(orders));
        
        showMessage(`✅ Pedido ${orderNumber} actualizado a: ${newStatus}`, 'success');
        closeOrderModal();
        renderOrdersList();
    }
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// ===== CONFIGURACIÓN =====
function loadConfigForm() {
    document.getElementById('configStoreName').value = storeConfig.storeName || '';
    document.getElementById('configStoreEmail').value = storeConfig.storeEmail || '';
    document.getElementById('configPhone').value = storeConfig.phone || '';
    document.getElementById('configShippingCost').value = storeConfig.shippingCost || 8000;
    document.getElementById('configShippingFreeMin').value = storeConfig.shippingFreeMin || 200000;
    document.getElementById('configMinOrder').value = storeConfig.minOrder || 1;
}

function saveStoreConfig() {
    storeConfig = {
        storeName: document.getElementById('configStoreName').value.trim(),
        storeEmail: document.getElementById('configStoreEmail').value.trim(),
        phone: document.getElementById('configPhone').value.trim(),
        shippingCost: parseInt(document.getElementById('configShippingCost').value) || 8000,
        shippingFreeMin: parseInt(document.getElementById('configShippingFreeMin').value) || 200000,
        minOrder: parseInt(document.getElementById('configMinOrder').value) || 1
    };
    
    localStorage.setItem('tiendaConfig', JSON.stringify(storeConfig));
    showMessage('✅ Configuración guardada correctamente', 'success');
}

// ===== EXPORTACIÓN =====
function exportForNetlify() {
    const exportData = {
        products: products,
        lastUpdated: new Date().toISOString(),
        totalProducts: products.length,
        config: storeConfig
    };
    
    // Crear archivo JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Crear enlace de descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = `productos_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('✅ Archivo JSON listo para Netlify', 'success');
    
    // Mostrar instrucciones
    setTimeout(() => {
        alert('📋 INSTRUCCIONES PARA NETLIFY:\n\n' +
              '1. Archivo descargado en tu dispositivo\n' +
              '2. Ve a GitHub.com y busca tu repositorio\n' +
              '3. Sube este archivo (reemplaza el anterior productos.json)\n' +
              '4. Netlify se actualizará automáticamente en 1-2 minutos\n\n' +
              'Enlace para GitHub: https://github.com/mitienda244-gif/catalogo-tienda');
    }, 1000);
}

function exportToExcel() {
    if (products.length === 0) {
        showMessage('No hay productos para exportar', 'danger');
        return;
    }
    
    // Crear contenido CSV
    let csvContent = "Código,Nombre,Marca,Modelo,Color,Talle,Stock,Precio,Categoría,Descripción\n";
    
    products.forEach(product => {
        const row = [
            product.codigo,
            `"${product.nombre}"`,
            product.marca,
            product.modelo,
            product.color,
            product.talle,
            product.stock,
            product.precio,
            product.categoria,
            `"${product.descripcion}"`
        ].join(',');
        
        csvContent += row + '\n';
    });
    
    // Crear archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `productos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('✅ Productos exportados a Excel (CSV)', 'success');
}

function backupData() {
    const backup = {
        products: products,
        orders: orders,
        config: storeConfig,
        backupDate: new Date().toISOString(),
        totalProducts: products.length,
        totalOrders: orders.length
    };
    
    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_tienda_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('✅ Copia de seguridad creada', 'success');
}

// ===== UTILIDADES =====
function formatPrice(price) {
    if (!price) return "0";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function showMessage(message, type = 'info') {
    // Crear elemento de mensaje
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2e7d32' : type === 'danger' ? '#d32f2f' : '#1976d2'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2000;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
    `;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'danger' ? 'exclamation-circle' : 'info-circle';
    
    messageDiv.innerHTML = `
        <i class="fas fa-${icon}"></i>
        ${message}
    `;
    
    document.body.appendChild(messageDiv);
    
    // Remover después de 4 segundos
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => messageDiv.remove(), 300);
    }, 4000);
    
    // Agregar animaciones si no existen
    if (!document.querySelector('#messageAnimations')) {
        const style = document.createElement('style');
        style.id = 'messageAnimations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}
