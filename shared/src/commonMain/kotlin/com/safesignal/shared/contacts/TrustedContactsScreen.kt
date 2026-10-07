package com.safesignal.shared.contacts

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.AlertDialog
import androidx.compose.material.Button
import androidx.compose.material.ButtonDefaults
import androidx.compose.material.OutlinedButton
import androidx.compose.material.OutlinedTextField
import androidx.compose.material.Surface
import androidx.compose.material.Text
import androidx.compose.material.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.safesignal.shared.design.SafeSignalColors

private enum class ContactFilter(val label: String) {
    ALL("All"),
    FAMILY("Family"),
    FRIENDS("Friends"),
    MEDICAL("Medical"),
}

@Composable
fun TrustedContactsScreen(
    contacts: List<TrustedContact>,
    defaultCallingCode: String,
    onAddContact: (
        name: String,
        phoneE164: String,
        group: ContactGroup,
    ) -> Unit,
    onRemoveContact: (String) -> Unit,
) {
    var filter by remember { mutableStateOf(ContactFilter.ALL) }
    var showAddDialog by remember { mutableStateOf(false) }

    val visibleContacts = contacts.filter { contact ->
        when (filter) {
            ContactFilter.ALL -> true
            ContactFilter.FAMILY -> contact.group == ContactGroup.FAMILY ||
                contact.group == ContactGroup.PARTNER
            ContactFilter.FRIENDS -> contact.group == ContactGroup.FRIENDS ||
                contact.group == ContactGroup.NEIGHBOUR
            ContactFilter.MEDICAL -> contact.group == ContactGroup.MEDICAL
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp, vertical = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = "Trusted Contacts",
                    color = SafeSignalColors.TextPrimary,
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "People you choose to contact during a safety event.",
                    color = SafeSignalColors.TextSecondary,
                    fontSize = 13.sp,
                )
            }

            Button(
                onClick = { showAddDialog = true },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = SafeSignalColors.PrimaryAction,
                    contentColor = Color.White,
                ),
            ) {
                Text("Add")
            }
        }

        Surface(
            color = SafeSignalColors.BackgroundSurface,
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(
                text = "SafeSignal does not read your address book. Add only the people you trust. Enhanced app alerts require their acceptance.",
                modifier = Modifier.padding(14.dp),
                color = SafeSignalColors.TextSecondary,
                fontSize = 12.sp,
                lineHeight = 17.sp,
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            ContactFilter.entries.forEach { item ->
                val selected = item == filter
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { filter = item }
                        .semantics {
                            contentDescription = item.label + " contacts filter"
                        },
                    color = if (selected) {
                        SafeSignalColors.PrimaryAction.copy(alpha = 0.18f)
                    } else {
                        SafeSignalColors.BackgroundSurface
                    },
                    shape = RoundedCornerShape(12.dp),
                ) {
                    Text(
                        text = item.label,
                        modifier = Modifier.padding(vertical = 11.dp),
                        color = if (selected) {
                            Color.White
                        } else {
                            SafeSignalColors.TextSecondary
                        },
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        fontSize = 12.sp,
                        fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                    )
                }
            }
        }

        if (visibleContacts.isEmpty()) {
            EmptyContactsState(hasAnyContacts = contacts.isNotEmpty())
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(
                    items = visibleContacts,
                    key = { contact -> contact.id },
                ) { contact ->
                    ContactCard(
                        contact = contact,
                        onRemove = { onRemoveContact(contact.id) },
                    )
                }
            }
        }
    }

    if (showAddDialog) {
        AddTrustedContactDialog(
            defaultCallingCode = defaultCallingCode,
            onDismiss = { showAddDialog = false },
            onSave = { name, phone, group ->
                onAddContact(name, phone, group)
                showAddDialog = false
            },
        )
    }
}

@Composable
private fun EmptyContactsState(hasAnyContacts: Boolean) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = if (hasAnyContacts) "No contacts in this group" else "No trusted contacts yet",
                color = SafeSignalColors.TextPrimary,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = if (hasAnyContacts) {
                    "Choose another filter to see your contacts."
                } else {
                    "Add someone you trust. SafeSignal will never upload your full address book."
                },
                color = SafeSignalColors.TextSecondary,
                fontSize = 12.sp,
            )
        }
    }
}

@Composable
private fun ContactCard(
    contact: TrustedContact,
    onRemove: () -> Unit,
) {
    Surface(
        color = SafeSignalColors.CardSurface,
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .background(
                        color = SafeSignalColors.PrimaryAction.copy(alpha = 0.16f),
                        shape = CircleShape,
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = initialsFor(contact.name),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                )
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(3.dp),
            ) {
                Text(
                    text = contact.name,
                    color = SafeSignalColors.TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = contact.phoneE164,
                    color = SafeSignalColors.TextSecondary,
                    fontSize = 12.sp,
                )
                Text(
                    text = contact.group.displayName + " · " + acceptanceLabel(contact.acceptanceStatus),
                    color = acceptanceColor(contact.acceptanceStatus),
                    fontSize = 11.sp,
                )
            }

            TextButton(onClick = onRemove) {
                Text(
                    text = "Remove",
                    color = SafeSignalColors.TextSecondary,
                    fontSize = 12.sp,
                )
            }
        }
    }
}

@Composable
private fun AddTrustedContactDialog(
    defaultCallingCode: String,
    onDismiss: () -> Unit,
    onSave: (
        name: String,
        phoneE164: String,
        group: ContactGroup,
    ) -> Unit,
) {
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var group by remember { mutableStateOf(ContactGroup.FAMILY) }
    var validationErrors by remember { mutableStateOf(emptyList<String>()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        backgroundColor = SafeSignalColors.BackgroundSurface,
        shape = RoundedCornerShape(18.dp),
        title = {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = "Add Trusted Contact",
                    color = SafeSignalColors.TextPrimary,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "Only add someone you know and trust.",
                    color = SafeSignalColors.TextSecondary,
                    fontSize = 12.sp,
                )
            }
        },
        text = {
            Column(
                modifier = Modifier.heightIn(max = 470.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = {
                        name = it
                        validationErrors = emptyList()
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    label = { Text("Name") },
                )

                OutlinedTextField(
                    value = phone,
                    onValueChange = {
                        phone = it
                        validationErrors = emptyList()
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    label = { Text("Phone number") },
                    placeholder = { Text(defaultCallingCode + " …") },
                )

                Text(
                    text = "Group",
                    color = SafeSignalColors.TextSecondary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                )

                ContactGroup.entries
                    .filter { it != ContactGroup.CUSTOM }
                    .chunked(3)
                    .forEach { row ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                        ) {
                            row.forEach { option ->
                                OutlinedButton(
                                    onClick = { group = option },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.outlinedButtonColors(
                                        backgroundColor = if (group == option) {
                                            SafeSignalColors.PrimaryAction.copy(alpha = 0.16f)
                                        } else {
                                            Color.Transparent
                                        },
                                        contentColor = if (group == option) {
                                            Color.White
                                        } else {
                                            SafeSignalColors.TextSecondary
                                        },
                                    ),
                                    shape = RoundedCornerShape(10.dp),
                                ) {
                                    Text(
                                        text = option.displayName,
                                        fontSize = 10.sp,
                                        maxLines = 1,
                                    )
                                }
                            }
                        }
                    }

                validationErrors.forEach { error ->
                    Text(
                        text = error,
                        color = SafeSignalColors.Emergency,
                        fontSize = 12.sp,
                    )
                }

                Text(
                    text = "The contact starts as Pending. Enhanced SafeSignal alerts activate only after the contact accepts.",
                    color = SafeSignalColors.TextSecondary,
                    fontSize = 11.sp,
                    lineHeight = 16.sp,
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val result = TrustedContactValidator.validate(
                        name = name,
                        rawPhone = phone,
                        callingCode = defaultCallingCode,
                    )

                    if (result.isValid) {
                        onSave(
                            requireNotNull(result.normalizedName),
                            requireNotNull(result.normalizedPhoneE164),
                            group,
                        )
                    } else {
                        validationErrors = result.errors
                    }
                },
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = SafeSignalColors.PrimaryAction,
                    contentColor = Color.White,
                ),
            ) {
                Text("Add Contact")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(
                    text = "Cancel",
                    color = SafeSignalColors.TextSecondary,
                )
            }
        },
    )
}

private fun initialsFor(name: String): String {
    val parts = name
        .trim()
        .split(" ")
        .filter { it.isNotBlank() }

    return parts
        .take(2)
        .mapNotNull { it.firstOrNull()?.uppercase() }
        .joinToString("")
        .ifBlank { "?" }
}

private fun acceptanceLabel(status: ContactAcceptanceStatus): String = when (status) {
    ContactAcceptanceStatus.PENDING -> "Pending acceptance"
    ContactAcceptanceStatus.ACCEPTED -> "Accepted"
    ContactAcceptanceStatus.DECLINED -> "Declined"
    ContactAcceptanceStatus.BLOCKED -> "Blocked"
}

private fun acceptanceColor(status: ContactAcceptanceStatus): Color = when (status) {
    ContactAcceptanceStatus.PENDING -> SafeSignalColors.Warning
    ContactAcceptanceStatus.ACCEPTED -> SafeSignalColors.Safe
    ContactAcceptanceStatus.DECLINED -> SafeSignalColors.TextSecondary
    ContactAcceptanceStatus.BLOCKED -> SafeSignalColors.Emergency
}
