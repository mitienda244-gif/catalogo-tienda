 # Catálogo Mayorista de Zapatillas - Dinámico

Tienda online profesional con catálogo cargado desde Google Sheets.

## 🚀 Cómo usar

### 1. Configurar Google Sheets
1. Crea un Google Sheets con esta estructura:

|  Código  |      Nombre     | Marca | Modelo  | Color | Talle | Stock | Precio |    Imagen   | Categoría  |   Descripción  |
|----------|-----------------|-------|---------|-------|-------|-------|--------|-------------|------------|----------------|
| NIKE-001 | Zapatillas Nike |  Nike | Air Max | Negro |  40   |  100  | 85000  | https://... | Deportivas | Descripción... |

2. Ve a **Archivo → Compartir → Publicar en la web**
3. Selecciona **"Valores separados por comas (.csv)"**
4. Copia el enlace generado

### 2. Actualizar el código
1. Abre `index.html`
2. Busca esta línea (alrededor de la línea 3520):
```javascript
const GOOGLE_SHEETS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUjWk9bqB4JpJgO7zH5m5Y6VX7s8t9u0v1w2x3y4z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P/pub?output=csv";
