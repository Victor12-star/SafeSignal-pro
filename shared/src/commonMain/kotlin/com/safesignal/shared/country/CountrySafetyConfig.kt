package com.safesignal.shared.country

data class EmergencyNumber(
    val label: String,
    val number: String,
    val verifiedAt: String,
    val sourceName: String,
    val sourceUrl: String,
)

data class CountrySafetyConfig(
    val countryCode: String,
    val countryName: String,
    val callingCode: String,
    val defaultLanguage: String,
    val supportedLanguages: List<String>,
    val emergencyNumbers: List<EmergencyNumber>,
    val lowDataDefault: Boolean,
)

object CountrySafetyConfigs {
    val Sweden = CountrySafetyConfig(
        countryCode = "SE",
        countryName = "Sweden",
        callingCode = "+46",
        defaultLanguage = "en",
        supportedLanguages = listOf("en", "sv"),
        emergencyNumbers = listOf(
            EmergencyNumber(
                label = "Emergency services",
                number = "112",
                verifiedAt = "2026-10-07",
                sourceName = "SOS Alarm",
                sourceUrl = "https://www.sosalarm.se/",
            ),
        ),
        lowDataDefault = false,
    )

    val Nigeria = CountrySafetyConfig(
        countryCode = "NG",
        countryName = "Nigeria",
        callingCode = "+234",
        defaultLanguage = "en",
        supportedLanguages = listOf("en"),
        emergencyNumbers = listOf(
            EmergencyNumber(
                label = "National emergency number",
                number = "112",
                verifiedAt = "2026-10-07",
                sourceName = "Nigerian Communications Commission",
                sourceUrl = "https://www.ncc.gov.ng/",
            ),
        ),
        lowDataDefault = true,
    )
}
