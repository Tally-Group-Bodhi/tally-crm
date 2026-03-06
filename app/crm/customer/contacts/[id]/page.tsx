"use client";

import React from "react";
import { useParams } from "next/navigation";
import { getContactWithAccount } from "@/lib/mock-data/accounts";
import type { Contact } from "@/types/crm";
import ContactContextPanel from "@/components/crm/ContactContextPanel";
import ContactDetailContent from "@/components/crm/ContactDetailContent";

function cloneContact(contact: Contact): Contact {
  return JSON.parse(JSON.stringify(contact));
}

export default function ContactDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const contactWithAccount = getContactWithAccount(id);

  const [localContact, setLocalContact] = React.useState<Contact | null>(() =>
    contactWithAccount ? cloneContact(contactWithAccount.contact) : null
  );
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    const data = getContactWithAccount(id);
    setLocalContact(data ? cloneContact(data.contact) : null);
  }, [id]);

  const updateContact = (updates: Partial<Contact>) => {
    setLocalContact((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    const data = getContactWithAccount(id);
    setLocalContact(data ? cloneContact(data.contact) : null);
    setIsEditing(false);
  };

  if (!contactWithAccount || !localContact) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">Contact not found.</p>
      </div>
    );
  }

  const { account } = contactWithAccount;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <ContactContextPanel
        contact={localContact}
        account={account}
        onEdit={() => setIsEditing(true)}
      />

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-auto">
        <ContactDetailContent
          contact={localContact}
          account={account}
          showBreadcrumbs
          isEditing={isEditing}
          onUpdateContact={updateContact}
          onSave={handleSave}
          onCancel={handleCancel}
          onEdit={() => setIsEditing(true)}
        />
      </div>
    </div>
  );
}
