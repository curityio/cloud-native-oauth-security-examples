plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    compileSdk = 34
    namespace = "com.example.demoapp"

    defaultConfig {
        applicationId = "com.example.demoapp"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {

    // Kotlin extensions
    implementation("androidx.core:core-ktx:1.13.1")

    // Jetpack compose
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation(platform("androidx.compose:compose-bom:2024.09.01"))

    // UI elements
    implementation("androidx.compose.ui:ui:1.7.1")
    implementation("androidx.compose.ui:ui-graphics:1.7.1")
    implementation("androidx.compose.material3:material3:1.3.0")

    // Custom tabs support
    implementation ("androidx.browser:browser:1.8.0")

    // ID token validation
    implementation ("org.bitbucket.b_c:jose4j:0.9.6")

    // API requests and JSON handling
    implementation ("com.squareup.okhttp3:okhttp:4.12.0")
    implementation ("com.google.code.gson:gson:2.11.0")
}