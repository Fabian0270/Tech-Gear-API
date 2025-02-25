const Database = require("better-sqlite3");
const db = new Database("./TechGearWebShop.db", { verbose: console.log });

// Hjälpfunktion för att hämta produkter
const getProductsQuery = () => `
SELECT 
    p.product_id,
    p.name, 
    p.description, 
    p.price, 
    p.stock_quantity, 
    m.name AS manufacturer,
    c.name AS category
FROM products p
JOIN manufacturers m ON p.manufacturer_id = m.manufacturer_id
LEFT JOIN products_categories pc ON p.product_id = pc.product_id
LEFT JOIN categories c ON pc.category_id = c.category_id
`;

// Funktioner för att hantera recensioner och kategorier
const deleteReviewsForProducts = () => {
    db.prepare("DELETE FROM reviews WHERE product_id IN (SELECT product_id FROM products)").run();
};

const updateProductsCategoriesTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS products_categories_temp (
            id INTEGER PRIMARY KEY, 
            product_id INTEGER, 
            category_id INTEGER, 
            FOREIGN KEY (product_id) REFERENCES products (product_id) ON UPDATE CASCADE, 
            FOREIGN KEY (category_id) REFERENCES categories (category_id) ON UPDATE CASCADE
        )
    `).run();

    db.prepare("INSERT INTO products_categories_temp (id, product_id, category_id) SELECT id, product_id, category_id FROM products_categories").run();
    db.prepare("DROP TABLE products_categories").run();
    db.prepare("ALTER TABLE products_categories_temp RENAME TO products_categories").run();
};

// Hantering av produkter
const ProductHandler = {
    getAllProducts: (minPrice, maxPrice) => {
        const conditions = [];
        const params = [];
        let query = getProductsQuery();

        if (minPrice !== undefined) {
            conditions.push("p.price >= ?");
            params.push(minPrice);
        }
        if (maxPrice !== undefined) {
            conditions.push("p.price <= ?");
            params.push(maxPrice);
        }

        if (conditions.length) {
            query += " WHERE " + conditions.join(" AND ");
        }

        return db.prepare(query).all(...params);
    },

    getProductById: (id) => db.prepare(`${getProductsQuery()} WHERE p.product_id = ?`).get(id),

    searchProductsByName: (name) => db.prepare(`${getProductsQuery()} WHERE p.name LIKE ?`).all(`%${name}%`),

    getProductsByCategory: (categoryId) => db.prepare(`${getProductsQuery()} WHERE c.category_id = ?`).all(categoryId),

    addNewProduct: (manufacturerId, name, description, price, stock) => {
        return db.prepare(
            "INSERT INTO products (manufacturer_id, name, description, price, stock_quantity) VALUES (?, ?, ?, ?, ?)"
        ).run(manufacturerId, name, description, price, stock);
    },

    updateProduct: (id, manufacturerId, name, description, price, stock) => {
        return db.prepare(
            "UPDATE products SET manufacturer_id = ?, name = ?, description = ?, price = ?, stock_quantity = ? WHERE product_id = ?"
        ).run(manufacturerId, name, description, price, stock, id);
    },

    deleteProduct: (id) => {
        deleteReviewsForProducts();
        return db.prepare("DELETE FROM products WHERE product_id = ?").run(id);
    }
};

// Hantering av kunder
const CustomerHandler = {
    getCustomerById: (id) => {
        const query = `
        SELECT 
            c.customer_id AS Customer_Id, 
            c.name, 
            c.email, 
            c.phone, 
            c.address, 
            c.password,
            JSON_GROUP_ARRAY(JSON_OBJECT('Order_Nr', o.order_id, 'Order_Date', o.order_date)) AS Orders
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.customer_id
        WHERE c.customer_id = ?
        GROUP BY c.customer_id`;
        return db.prepare(query).get(id);
    },

    updateCustomerContactInfo: (id, email, phone, address) => {
        return db.prepare(
            "UPDATE customers SET email = ?, phone = ?, address = ? WHERE customer_id = ?"
        ).run(email, phone, address, id);
    },

    getOrdersByCustomer: (id) => {
        const query = `
        SELECT
            o.order_id AS Order_Nr, 
            o.order_date AS Order_Date,
            p.name AS Product,
            op.quantity AS Quantity,
            op.unit_price AS Unit_Price
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.customer_id
        LEFT JOIN orders_products op ON op.order_id = o.order_id
        LEFT JOIN products p ON p.product_id = op.product_id
        WHERE c.customer_id = ?`;
        return db.prepare(query).all(id);
    }
};

// Hantering av statistik
const StatsHandler = {
    getProductStats: () => {
        const query = `
        SELECT 
            c.name AS Category,
            COUNT(p.product_id) AS Products,
            AVG(p.price) AS Average_Price
        FROM categories c
        LEFT JOIN products_categories pc ON pc.category_id = c.category_id
        LEFT JOIN products p ON p.product_id = pc.product_id
        GROUP BY c.category_id`;
        return db.prepare(query).all();
    },

    getReviewStats: () => {
        const query = `
        SELECT 
            p.name AS Product, 
            AVG(r.rating) AS Average_Score
        FROM products p
        LEFT JOIN reviews r ON r.product_id = p.product_id
        GROUP BY p.product_id`;
        return db.prepare(query).all();
    }
};

// Exportera alla tjänster
module.exports = {
    ...ProductHandler,
    ...CustomerHandler,
    ...StatsHandler,
    deleteReviewsForProducts,
    updateProductsCategoriesTable
};
