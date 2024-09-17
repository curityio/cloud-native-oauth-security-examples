package com.example.demoapi

import java.sql.Connection
import java.sql.DriverManager

/*
 * A repository class that connects to a JDBC database using mTLS
 */
class ProductsRepository {

    fun loadProducts(): List<Product> {

        val products = ArrayList<Product>()
        val connection = getConnection()
        connection.use {

            val query = connection.prepareStatement("SELECT * FROM products")
            val rows = query.executeQuery()

            while (rows.next()) {
                val id = rows.getString("id")
                val name = rows.getString("name")
                products.add(Product(id, name))
            }
        }

        return products
    }

    private fun getConnection(): Connection {
        val jdbcUrl = System.getenv("API_DB_CONNECTION")
        return DriverManager.getConnection(jdbcUrl)
    }
}
