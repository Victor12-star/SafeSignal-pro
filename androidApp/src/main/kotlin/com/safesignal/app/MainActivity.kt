package com.safesignal.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.safesignal.app.contacts.AndroidEncryptedTrustedContactRepository
import com.safesignal.shared.SafeSignalApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val trustedContactRepository = AndroidEncryptedTrustedContactRepository(
            applicationContext,
        )

        setContent {
            SafeSignalApp(
                trustedContactRepository = trustedContactRepository,
            )
        }
    }
}
