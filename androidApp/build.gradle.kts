import org.jetbrains.kotlin.gradle.dsl.JvmTarget

fun String.asBuildConfigString(): String =
    "\"" + replace("\\", "\\\\").replace("\"", "\\\"") + "\""

val safeSignalSupabaseUrl =
    providers.gradleProperty("SAFESIGNAL_SUPABASE_URL")
        .orElse(providers.environmentVariable("SAFESIGNAL_SUPABASE_URL"))
        .getOrElse("")

val safeSignalSupabasePublishableKey =
    providers.gradleProperty("SAFESIGNAL_SUPABASE_PUBLISHABLE_KEY")
        .orElse(providers.environmentVariable("SAFESIGNAL_SUPABASE_PUBLISHABLE_KEY"))
        .getOrElse("")

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.compose.compiler)
}

android {
    namespace = "com.safesignal.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.safesignal.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"

        buildConfigField(
            "String",
            "SUPABASE_URL",
            safeSignalSupabaseUrl.asBuildConfigString(),
        )
        buildConfigField(
            "String",
            "SUPABASE_PUBLISHABLE_KEY",
            safeSignalSupabasePublishableKey.asBuildConfigString(),
        )
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }

        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    implementation(project(":shared"))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.core.ktx)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.core)
    testImplementation(kotlin("test"))
}
