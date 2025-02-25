const express = require("express");
const db = require("./database.js"); 

const app = express();
const PORT = 8000;

// Middleware för JSON-hantering
app.use(express.json());

// Starta servern
app.listen(PORT, () => {
    console.log(`Servern körs på port ${PORT}`);
});

// Grundläggande route
app.get("/", (req, res) => {
    res.send("Tjena! har du hittat hit!");
});

// Hämta alla produkter (med filtrering)
app.get("/products", (req, res) => {
    const { minPrice, maxPrice } = req.query;
    try {
        const products = db.getAllProducts(minPrice, maxPrice);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Kunde inte hämta produkter" });
    }
});

// Hämta en produkt via ID
app.get("/products/:id", (req, res) => {
    try {
        const product = db.getProductById(req.params.id);
        product ? res.json(product) : res.status(404).json({ message: "Produkt ej hittad" });
    } catch (error) {
        res.status(500).json({ error: `Kunde inte hämta produkt med ID ${req.params.id}` });
    }
});

// Sök produkter via namn
app.get("/products/search", (req, res) => {
    const searchTerm = req.query.name;
    try {
        const products = db.searchProductsByName(searchTerm);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: `Kunde inte söka efter produkter med namn '${searchTerm}'` });
    }
});

// Hämta produkter via kategori
app.get("/products/category/:categoryId", (req, res) => {
    try {
        const products = db.getProductsByCategory(req.params.categoryId);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: `Kunde inte hämta produkter för kategori ${req.params.categoryId}` });
    }
});

// Skapa en ny produkt
app.post("/products", (req, res) => {
    const { manufacturer_id, name, description, price, stock_quantity } = req.body;
    try {
        const result = db.addNewProduct(manufacturer_id, name, description, price, stock_quantity);
        res.status(201).json({ message: "Produkt skapad", productId: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: "Misslyckades med att skapa produkt" });
    }
});

// Uppdatera en produkt
app.put("/products/:id", (req, res) => {
    const { manufacturer_id, name, description, price, stock_quantity } = req.body;
    try {
        const result = db.updateProduct(req.params.id, manufacturer_id, name, description, price, stock_quantity);
        result.changes ? res.json({ message: "Produkt uppdaterad" }) : res.status(404).json({ message: "Produkt ej hittad" });
    } catch (error) {
        res.status(500).json({ error: "Misslyckades med att uppdatera produkt" });
    }
});

// Ta bort en produkt
app.delete("/products/:id", (req, res) => {
    try {
        const result = db.deleteProduct(req.params.id);
        result.changes ? res.json({ message: "Produkt borttagen" }) : res.status(404).json({ message: "Produkt ej hittad" });
    } catch (error) {
        res.status(500).json({ error: "Misslyckades med att ta bort produkt" });
    }
});

// Hämta kund via ID
app.get("/customers/:id", (req, res) => {
    try {
        const customer = db.getCustomerById(req.params.id);
        customer ? res.json(customer) : res.status(404).json({ message: "Kund ej hittad" });
    } catch (error) {
        res.status(500).json({ error: `Kunde inte hämta kund med ID ${req.params.id}` });
    }
});

// Uppdatera kundens kontaktinformation
app.put("/customers/:id", (req, res) => {
    const { email, phone, address } = req.body;
    try {
        const result = db.updateCustomerContactInfo(req.params.id, email, phone, address);
        result.changes ? res.json({ message: "Kund uppdaterad" }) : res.status(404).json({ message: "Kund ej hittad" });
    } catch (error) {
        res.status(500).json({ error: "Misslyckades med att uppdatera kund" });
    }
});

// Hämta kundens ordrar
app.get("/customers/:id/orders", (req, res) => {
    try {
        const orders = db.getOrdersByCustomer(req.params.id);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: `Kunde inte hämta ordrar för kund med ID ${req.params.id}` });
    }
});

// Statistik: produkter per kategori
app.get("/products/stats", (req, res) => {
    try {
        const stats = db.getProductStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: "Kunde inte hämta produktstatistik" });
    }
});

// Statistik: genomsnittliga betyg per produkt
app.get("/reviews/stats", (req, res) => {
    try {
        const stats = db.getReviewStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: "Kunde inte hämta recensionstatistik" });
    }
});

// Ta bort recensioner för en produkt
app.delete("/products/:id/reviews", (req, res) => {
    try {
        db.deleteReviewsForProducts(req.params.id);
        res.json({ message: "Recensioner borttagna" });
    } catch (error) {
        res.status(500).json({ error: "Misslyckades med att ta bort recensioner" });
    }
});

// Uppdatera produkter i kategorier
app.put("/categories/:categoryId/products", (req, res) => {
    try {
        db.updateProductsCategoriesTable();
        res.json({ message: "Produkter i kategori uppdaterade" });
    } catch (error) {
        res.status(500).json({ error: "Misslyckades med att uppdatera produkter i kategori" });
    }
});