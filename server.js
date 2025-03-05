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

// Hämta produktstatistik 
app.get("/products/stats", (req, res) => {
    try {
        const stats = db.getProductStats();
        res.json(stats);
    } catch (error) {
        console.error("Fel vid hämtning av produktstatistik:", error);
        res.status(500).json({ error: "Kunde inte hämta produktstatistik" });
    }
});

// Hämta alla produkter
app.get("/products", (req, res) => {
    try {
        const products = db.getAllProducts();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Kunde inte hämta produkter" });
    }
});

// Sök produkter via namn 
app.get("/products/search", (req, res) => {
    const searchTerm = req.query.name;
    try {
        if (!searchTerm) {
            return res.status(400).json({ error: "Sökterm saknas" });
        }

        const products = db.searchProductsByName(searchTerm);
        res.json(products);
    } catch (error) {
        console.error("Fel vid produktsökning:", error);
        res.status(500).json({ error: "Kunde inte söka efter produkter" });
    }
});

// Hämta en produkt via ID 
app.get("/products/:id", (req, res) => {
    try {
        const product = db.getProductById(req.params.id);
        product ? res.json(product) : res.status(404).json({ message: "Produkt ej hittad" });
    } catch (error) {
        res.status(500).json({ error: "Kunde inte hämta produkt" });
    }
});


// Hämta produkter via kategori
app.get("/products/category/:categoryId", (req, res) => {
    try {
        const products = db.getProductsByCategory(req.params.categoryId);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Kunde inte hämta produkter för kategori" });
    }
});

// Skapa en ny produkt
app.post("/products", (req, res) => {
    const { manufacturer_id, name, description, price, stock_quantity } = req.body;
    try {
        db.addNewProduct(manufacturer_id, name, description, price, stock_quantity);
        res.status(201).json({ message: "Produkt skapad" });
    } catch (error) {
        res.status(500).json({ error: "Misslyckades med att skapa produkt" });
    }
});

// Uppdatera en produkt
app.put("/products/:id", (req, res) => {
    const { manufacturer_id, name, description, price, stock_quantity } = req.body;
    try {
        db.updateProduct(req.params.id, manufacturer_id, name, description, price, stock_quantity);
        res.json({ message: "Produkt uppdaterad" });
    } catch (error) {
        res.status(500).json({ error: "Misslyckades med att uppdatera produkt" });
    }
});

// Ta bort en produkt
app.delete("/products/:id", (req, res) => {
    try {
        db.deleteProduct(req.params.id);
        res.json({ message: "Produkt borttagen" });
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
        res.status(500).json({ error: "Kunde inte hämta kund" });
    }
});

// Uppdatera kundens kontaktinformation
app.put("/customers/:id", (req, res) => {
    const { email, phone, address } = req.body;
    try {
        db.updateCustomerContactInfo(req.params.id, email, phone, address);
        res.json({ message: "Kund uppdaterad" });
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
        res.status(500).json({ error: "Kunde inte hämta ordrar för kund" });
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

module.exports = app;
