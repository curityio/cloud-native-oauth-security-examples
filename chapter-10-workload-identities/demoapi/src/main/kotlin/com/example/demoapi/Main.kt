package com.example.demoapi

import com.google.gson.Gson
import spark.Spark.get
import spark.Spark.port

class Main {

    companion object {
        @JvmStatic
        fun main(args: Array<String>) {

            val portNumber = System.getenv("API_PORT") ?: "3000"
            port(portNumber.toInt());

            get("/products") { _, _ ->

                try {
                    val products = ProductsRepository().loadProducts()
                    val gson = Gson()
                    return@get gson.toJson(products)

                } catch (ex: Throwable) {

                    println(ex.stackTraceToString())
                    val apiError = ApiError("server_error", "Problem encountered in the products API: ${ex.message}")
                    val gson = Gson()
                    return@get gson.toJson(apiError)
                }
            }
        }
    }
}
