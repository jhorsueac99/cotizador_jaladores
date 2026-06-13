const productsList = document.getElementById("productsList");
const searchInput = document.getElementById("searchProducts");
const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
const sortButtons = Array.from(document.querySelectorAll(".sort-btn"));
const clearFiltersButton = document.getElementById("clearFilters");
const clearSelectionButton = document.getElementById("clearSelection");
const clienteInput = document.getElementById("cliente");
const totalElement = document.getElementById("total");
const generateButton = document.getElementById("generateQuote");
const selectedPreview = document.getElementById("selectedPreview");
const galleryMainImage = document.getElementById("galleryMainImage");
const galleryThumbs = document.getElementById("galleryThumbs");
const galleryName = document.getElementById("galleryName");
const galleryDescription = document.getElementById("galleryDescription");
const galleryBrand = document.getElementById("galleryBrand");
const galleryModel = document.getElementById("galleryModel");
const galleryMeasures = document.getElementById("galleryMeasures");
const galleryModal = document.getElementById("galleryModal");
const galleryModalMainImage = document.getElementById("galleryModalMainImage");
const galleryModalThumbs = document.getElementById("galleryModalThumbs");
const galleryModalTitle = document.getElementById("galleryModalTitle");
const galleryModalDescription = document.getElementById("galleryModalDescription");
const galleryModalBrand = document.getElementById("galleryModalBrand");
const galleryModalModel = document.getElementById("galleryModalModel");
const galleryModalMeasures = document.getElementById("galleryModalMeasures");
const galleryModalClose = document.getElementById("galleryModalClose");
const productsCount = document.getElementById("productsCount");
const quoteResult = document.getElementById("quoteResult");
const quoteClient = document.getElementById("quoteClient");
const quoteItems = document.getElementById("quoteItems");
const quoteTotal = document.getElementById("quoteTotal");

let products = [];
let activeFilter = "all";
let activeSort = "default";
let selectedProductsState = {};
let activeGalleryProduct = null;
let companyInfo = {
  nombre: "",
  direccion: "",
  telefono: "",
  logo: ""
};

function formatCurrency(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

async function loadProducts() {
  const candidates = ["./data/productos.json", "../data/productos.json"];

  for (const path of candidates) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        products = await response.json();
        renderProducts();
        updateTotal();
        return;
      }
    } catch (error) {
      console.warn(`No se pudo cargar ${path} - app.js:35`, error);
    }
  }

  productsList.innerHTML = "<p>No se pudieron cargar los productos.</p>";
}

function getFilteredProducts(filter = "", sort = "default") {
  const term = filter.trim().toLowerCase();
  let filteredProducts = products.filter((product) => product.nombre.toLowerCase().includes(term));

  if (activeFilter !== "all") {
    filteredProducts = filteredProducts.filter((product) => {
      const name = product.nombre.toLowerCase();
      return activeFilter === "puerta" ? name.includes("puerta") : name.includes("mampara");
    });
  }

  if (sort === "precio-asc") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.precio - b.precio);
  } else if (sort === "precio-desc") {
    filteredProducts = [...filteredProducts].sort((a, b) => b.precio - a.precio);
  }

  return filteredProducts;
}

function renderProducts(filter = "") {
  const filteredProducts = getFilteredProducts(filter, activeSort);
  productsCount.textContent = `${filteredProducts.length} producto${filteredProducts.length === 1 ? "" : "s"}`;

  productsList.innerHTML = filteredProducts
    .map((product) => {
      const state = selectedProductsState[product.id] || { checked: false, quantity: 1 };
      const checkedAttr = state.checked ? "checked" : "";
      const disabledAttr = state.checked ? "" : "disabled";
      const quantityValue = state.checked ? state.quantity : 1;
      const cardClass = state.checked ? "product-card selected" : "product-card";
      const imagePath = product.imagen ? resolveAssetPath(product.imagen) : "";

      return `
        <div class="${cardClass}">
          <label class="product-label">
            <input type="checkbox" class="product-checkbox" data-id="${product.id}" data-name="${product.nombre}" data-price="${product.precio}" ${checkedAttr} />
            <div class="product-info">
              ${imagePath ? `<img src="${imagePath}" alt="${product.nombre}" class="product-image" data-product-id="${product.id}" role="button" tabindex="0" />` : ""}
              <div class="product-text">
                <span class="product-title">${product.nombre}</span>
                <span class="product-helper">Explora vistas y detalles</span>
              </div>
            </div>
          </label>
          <div class="product-controls">
            <label for="qty-${product.id}">Cantidad</label>
            <input type="number" id="qty-${product.id}" class="product-quantity" data-id="${product.id}" min="1" value="${quantityValue}" ${disabledAttr} />
          </div>
          <span class="price">${formatCurrency(product.precio)}</span>
        </div>
      `;
    })
    .join("");

  updateSelectionPreview();
  if (products.length && !activeGalleryProduct) {
    showProductGallery(products[0]);
  }
}

function getProductGalleryImages(product) {
  const explicitImages = Array.isArray(product.imagenesExtra) && product.imagenesExtra.length > 0
    ? product.imagenesExtra.map((item) => resolveAssetPath(item))
    : Array.isArray(product.galeria) && product.galeria.length > 0
      ? product.galeria.map((item) => resolveAssetPath(item))
      : [];

  const fallbackImages = [
    resolveAssetPath(product.imagen || ""),
    resolveAssetPath("./imagenes/vista-frontal.svg"),
    resolveAssetPath("./imagenes/vista-lateral.svg")
  ].filter(Boolean);

  const combined = [...explicitImages, ...fallbackImages].filter((value, index, self) => self.indexOf(value) === index);

  return combined.length >= 3 ? combined.slice(0, 3) : [...combined, ...fallbackImages.filter((value) => !combined.includes(value))].slice(0, 3);
}

function getProductDetails(product) {
  const marca = product.marca || "Maphe";
  const modelo = product.modelo || product.nombre.replace(/^Jalador de /i, "").replace(/ de /g, " ").trim() || "Estándar";
  const medidas = product.medidas || "Medidas estándar según ficha técnica";
  const descripcion = product.descripcion || `${marca} ${modelo} en acero inoxidable para puertas y mamparas, con diseño funcional y acabado premium.`;

  return { marca, modelo, medidas, descripcion };
}

function updateGalleryView(product, index = 0, mode = "panel") {
  if (!product) {
    return;
  }

  const galleryImages = getProductGalleryImages(product);
  const { marca, modelo, medidas, descripcion } = getProductDetails(product);
  const safeIndex = Math.max(0, Math.min(index, galleryImages.length - 1));
  activeGalleryProduct = product;

  const mainImage = mode === "modal" ? galleryModalMainImage : galleryMainImage;
  const thumbsContainer = mode === "modal" ? galleryModalThumbs : galleryThumbs;
  const title = mode === "modal" ? galleryModalTitle : galleryName;
  const description = mode === "modal" ? galleryModalDescription : galleryDescription;
  const brand = mode === "modal" ? galleryModalBrand : galleryBrand;
  const model = mode === "modal" ? galleryModalModel : galleryModel;
  const measures = mode === "modal" ? galleryModalMeasures : galleryMeasures;

  mainImage.src = galleryImages[safeIndex] || "";
  mainImage.alt = `${product.nombre} vista ${safeIndex + 1}`;
  title.textContent = product.nombre;
  description.textContent = descripcion;
  brand.textContent = marca;
  model.textContent = modelo;
  measures.textContent = medidas;

  thumbsContainer.innerHTML = galleryImages
    .map((image, imageIndex) => `
      <button type="button" class="gallery-thumb-btn ${imageIndex === safeIndex ? "active" : ""}" data-index="${imageIndex}" aria-label="Vista ${imageIndex + 1} de ${product.nombre}">
        <img src="${image}" alt="${product.nombre} vista ${imageIndex + 1}" class="gallery-thumb" />
      </button>
    `)
    .join("");
}

function showProductGallery(product, index = 0) {
  if (!product) {
    return;
  }

  updateGalleryView(product, index, "panel");
}

function openGalleryModal(product, index = 0) {
  if (!product) {
    return;
  }

  updateGalleryView(product, index, "modal");
  galleryModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeGalleryModal() {
  galleryModal.hidden = true;
  document.body.style.overflow = "";
}

function getSelectedProducts() {
  return products
    .filter((product) => selectedProductsState[product.id]?.checked)
    .map((product) => {
      const state = selectedProductsState[product.id] || { checked: false, quantity: 1 };
      const cantidad = Number.isFinite(state.quantity) && state.quantity > 0 ? state.quantity : 1;
      const precio = Number(product?.precio || 0);

      return {
        id: product.id,
        nombre: product.nombre,
        precio,
        cantidad,
        subtotal: precio * cantidad
      };
    });
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

function updateTotal() {
  const selectedProducts = getSelectedProducts();
  totalElement.textContent = formatCurrency(calculateTotal(selectedProducts));
}

function updateSelectionPreview() {
  const selectedProducts = getSelectedProducts();

  if (selectedProducts.length === 0) {
    selectedPreview.innerHTML = `
      <h3>Productos seleccionados</h3>
      <p class="empty-state">Aún no has seleccionado productos.</p>
    `;
    return;
  }

  selectedPreview.innerHTML = `
    <h3>Productos seleccionados</h3>
    <ul>
      ${selectedProducts
        .map((item) => `<li><span>${item.nombre}</span><strong>${item.cantidad} × ${formatCurrency(item.precio)}</strong></li>`)
        .join("")}
    </ul>
    <p class="preview-total"><strong>Total provisional:</strong> ${formatCurrency(calculateTotal(selectedProducts))}</p>
  `;
}

searchInput.addEventListener("input", (event) => {
  renderProducts(event.target.value);
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    renderProducts(searchInput.value);
  });
});

sortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeSort = button.dataset.sort;
    sortButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    renderProducts(searchInput.value);
  });
});

clearFiltersButton.addEventListener("click", () => {
  searchInput.value = "";
  activeFilter = "all";
  activeSort = "default";
  filterButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.filter === "all"));
  sortButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.sort === "default"));
  renderProducts("");
});

clearSelectionButton.addEventListener("click", () => {
  selectedProductsState = {};
  renderProducts(searchInput.value);
  updateTotal();
  updateSelectionPreview();
});

function handleProductSelection(event) {
  if (event.target.classList.contains("product-checkbox")) {
    const id = Number(event.target.dataset.id);
    const state = selectedProductsState[id] || { checked: false, quantity: 1 };
    state.checked = event.target.checked;
    if (!state.checked) {
      state.quantity = 1;
    }
    selectedProductsState[id] = state;
    renderProducts(searchInput.value);
  }

  if (event.target.classList.contains("product-quantity")) {
    const id = Number(event.target.dataset.id);
    const value = Number(event.target.value);
    const normalizedValue = Number.isFinite(value) && value > 0 ? value : 1;
    event.target.value = String(normalizedValue);
    const state = selectedProductsState[id] || { checked: false, quantity: 1 };
    state.quantity = normalizedValue;
    selectedProductsState[id] = state;
    updateSelectionPreview();
  }

  updateTotal();
}

productsList.addEventListener("change", handleProductSelection);
productsList.addEventListener("input", handleProductSelection);
productsList.addEventListener("mouseover", (event) => {
  const image = event.target.closest(".product-image");
  if (!image) {
    return;
  }

  const product = products.find((item) => item.id === Number(image.dataset.productId));
  if (product) {
    showProductGallery(product);
  }
});
productsList.addEventListener("click", (event) => {
  const image = event.target.closest(".product-image");
  if (!image) {
    return;
  }

  event.preventDefault();
  const product = products.find((item) => item.id === Number(image.dataset.productId));
  if (product) {
    showProductGallery(product);
    openGalleryModal(product);
  }
});

galleryThumbs.addEventListener("click", (event) => {
  const button = event.target.closest(".gallery-thumb-btn");
  if (!button || !activeGalleryProduct) {
    return;
  }

  showProductGallery(activeGalleryProduct, Number(button.dataset.index));
});

galleryModalThumbs.addEventListener("click", (event) => {
  const button = event.target.closest(".gallery-thumb-btn");
  if (!button || !activeGalleryProduct) {
    return;
  }

  updateGalleryView(activeGalleryProduct, Number(button.dataset.index), "modal");
});

galleryModalClose.addEventListener("click", closeGalleryModal);
galleryModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-modal='true']")) {
    closeGalleryModal();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeGalleryModal();
  }
});

async function loadCompanyInfo() {
  const candidates = ["./data/empresa.json", "../data/empresa.json"];

  for (const path of candidates) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const empresa = await response.json();
        renderCompanyInfo(empresa);
        return;
      }
    } catch (error) {
      console.error("Error cargando empresa.json - app.js:124", error);
    }
  }
}

function resolveAssetPath(path) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalized = path.replace(/^\.\//, "");
  return new URL(`../${normalized}`, window.location.href).href;
}

function renderCompanyInfo(empresa) {
  companyInfo = empresa;
  document.getElementById("company-name").textContent = empresa.nombre;
  document.getElementById("company-address").textContent = empresa.direccion;
  document.getElementById("company-phone").textContent = empresa.telefono;

  const logo = empresa.logo || "";
  document.getElementById("company-logo").src = resolveAssetPath(logo);
}

async function loadImageAsDataUrl(url) {
  const response = await fetch(url);
  const blob = await response.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function generarPDF(cliente, productosSeleccionados, total, empresa) {
  if (!window.jspdf?.jsPDF) {
    alert("La librería jsPDF no está disponible.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const footerY = pageHeight - 42;
  const contentTop = 108;
  const contentBottom = footerY - 34;
  const primaryColor = [30, 64, 175];
  const mutedColor = [100, 116, 139];
  const darkColor = [15, 23, 42];
  const borderColor = [203, 213, 225];
  const quoteDate = new Date().toLocaleDateString("es-PE");
  const quoteNumber = `QT-${String(Date.now()).slice(-6)}`;
  let pageNumber = 1;

  const logoUrl = empresa.logo ? resolveAssetPath(empresa.logo) : "";
  let logoDataUrl = "";

  if (logoUrl) {
    try {
      logoDataUrl = await loadImageAsDataUrl(logoUrl);
    } catch (error) {
      console.warn("No se pudo cargar el logo para el PDF", error);
    }
  }

  function drawHeader() {
    doc.setFillColor(240, 247, 255);
    doc.rect(0, 0, pageWidth, 78, "F");

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", margin, 16, 42, 42);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text(empresa.nombre || "Cotización", margin + 56, 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...mutedColor);
    doc.text(empresa.direccion || "", margin + 56, 46);
    doc.text(`Tel: ${empresa.telefono || ""}`, margin + 56, 60);

    doc.setFontSize(13);
    doc.setTextColor(...darkColor);
    doc.text("Cotización premium", pageWidth - margin, 40, { align: "right" });
    doc.setDrawColor(...borderColor);
    doc.line(margin, 78, pageWidth - margin, 78);
  }

  function drawFooter(showPageNumber = true) {
    doc.setDrawColor(...borderColor);
    doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text(`Gracias por confiar en ${empresa.nombre || "nosotros"}`, margin, footerY - 2);
    doc.text(`${empresa.direccion || ""} · Tel: ${empresa.telefono || ""}`, pageWidth / 2, footerY, { align: "center" });
    if (showPageNumber) {
      doc.text(`Página ${pageNumber}`, pageWidth - margin, footerY, { align: "right" });
    }
  }

  function addWrappedText(text, x, y, maxWidth, lineHeight) {
    const lines = doc.splitTextToSize(text || "", maxWidth);
    doc.text(lines, x, y);
    return lines.length * lineHeight;
  }

  function startNewPage() {
    doc.addPage();
    pageNumber += 1;
    drawHeader();
    return contentTop;
  }

  drawHeader();

  let y = contentTop;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text(`Cliente: ${cliente}`, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Fecha: ${quoteDate}`, pageWidth - margin, y, { align: "right" });
  doc.text(`N° cotización: ${quoteNumber}`, pageWidth - margin, y + 14, { align: "right" });
  y += 24;

  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, y, contentWidth, 34, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text("Resumen de la cotización", margin + 12, y + 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text(`Productos seleccionados: ${productosSeleccionados.length}`, margin + 150, y + 22);
  y += 52;

  doc.setFillColor(250, 250, 255);
  doc.roundedRect(margin, y - 8, contentWidth, 34, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text("Detalles del pedido", margin + 12, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text(`Cliente: ${cliente} • Fecha: ${quoteDate} • Validez: 7 días • Entrega estimada: 5 a 7 días hábiles`, margin + 12, y + 20);
  doc.text("Los precios mostrados son referenciales y pueden ajustarse según medidas exactas, acabado y volumen del pedido.", margin + 12, y + 30);
  y += 44;

  doc.setFillColor(124, 58, 237);
  doc.rect(margin, y, contentWidth, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Producto", margin + 10, y + 14);
  doc.text("Cantidad", margin + 270, y + 14);
  doc.text("Precio unitario", margin + 340, y + 14);
  doc.text("Subtotal", margin + 430, y + 14);
  y += 26;

  for (const producto of productosSeleccionados) {
    if (y + 92 > contentBottom) {
      drawFooter();
      y = startNewPage();
    }

    doc.setDrawColor(...borderColor);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    const imageUrl = producto.imagen ? resolveAssetPath(producto.imagen) : "";
    let imageDataUrl = "";

    if (imageUrl) {
      try {
        imageDataUrl = await loadImageAsDataUrl(imageUrl);
      } catch (error) {
        console.warn("No se pudo cargar la imagen del producto para el PDF", error);
      }
    }

    const productTextX = margin + 70;
    const productTextWidth = 180;
    const description = producto.descripcion || `Marca: ${producto.marca || "Maphe"} · Modelo: ${producto.modelo || ""} · Medidas: ${producto.medidas || ""} · Acabado: ${producto.acabado || ""}`;

    if (imageDataUrl) {
      doc.addImage(imageDataUrl, "PNG", margin + 8, y - 2, 48, 36);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...darkColor);
    const nameHeight = addWrappedText(producto.nombre, productTextX, y, productTextWidth, 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    const descLines = doc.splitTextToSize(description, productTextWidth);
    const descHeight = descLines.length * 9;
    doc.text(descLines, productTextX, y + nameHeight + 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...darkColor);
    doc.text(String(producto.cantidad), margin + 270, y + 8);
    doc.text(formatCurrency(producto.precio), margin + 340, y + 8);
    doc.text(formatCurrency(producto.subtotal), margin + 430, y + 8);

    y += Math.max(46, nameHeight + descHeight + 12);
  }

  if (y + 60 > contentBottom) {
    drawFooter();
    y = startNewPage();
  }

  y += 14;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 38, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text("Total estimado", margin + 14, y + 24);
  doc.setFontSize(14);
  doc.text(formatCurrency(total), pageWidth - margin - 10, y + 24, { align: "right" });

  drawFooter();
  doc.save("cotizacion.pdf");
}

generateButton.addEventListener("click", async () => {
  const clientName = clienteInput.value.trim();
  const selectedProducts = getSelectedProducts();

  if (!clientName) {
    alert("Ingresa el nombre del cliente.");
    return;
  }

  if (selectedProducts.length === 0) {
    alert("Selecciona al menos un producto.");
    return;
  }

  const total = calculateTotal(selectedProducts);
  quoteClient.textContent = `Cliente: ${clientName}`;
  quoteItems.innerHTML = selectedProducts
    .map((item) => `<li>${item.nombre} × ${item.cantidad} — ${formatCurrency(item.subtotal)}</li>`)
    .join("");
  quoteTotal.textContent = formatCurrency(total);
  quoteResult.hidden = false;

  await generarPDF(clientName, selectedProducts, total, companyInfo);
});

loadProducts();
loadCompanyInfo();
updateSelectionPreview();
