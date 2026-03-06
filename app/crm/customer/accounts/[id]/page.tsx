"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import Button from "@/components/Button/Button";
import { getAccountById } from "@/lib/mock-data/accounts";
import type { Account, Contact } from "@/types/crm";

const ACCOUNT_TYPES = ["Residential", "Commercial", "Industrial"] as const;
const ACCOUNT_STATUSES = ["Active", "Suspended", "Closed"] as const;

function cloneAccount(account: Account): Account {
  return JSON.parse(JSON.stringify(account));
}

export default function AccountSettingsPage() {
  const params = useParams();
  const id = params.id as string;
  const initialAccount = getAccountById(id);

  const [account, setAccount] = React.useState<Account | null>(() =>
    initialAccount ? cloneAccount(initialAccount) : null
  );
  const [isEditing, setIsEditing] = React.useState(false);
  const [addContactOpen, setAddContactOpen] = React.useState(false);
  const [editingContactId, setEditingContactId] = React.useState<string | null>(
    null
  );
  const [editingContactDraft, setEditingContactDraft] =
    React.useState<Contact | null>(null);
  const [newContact, setNewContact] = React.useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    isPrimary: false,
  });

  // Sync from URL if it changes (e.g. navigation)
  React.useEffect(() => {
    const next = getAccountById(id);
    setAccount(next ? cloneAccount(next) : null);
  }, [id]);

  const updateAccount = (updates: Partial<Account>) => {
    setAccount((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const removeContact = (contactId: string) => {
    setAccount((prev) => {
      if (!prev) return null;
      const contacts = prev.contacts.filter((c) => c.id !== contactId);
      let primaryContact = prev.primaryContact;
      if (prev.primaryContact.id === contactId) {
        primaryContact = contacts[0] ?? prev.primaryContact;
      }
      return { ...prev, contacts, primaryContact };
    });
  };

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !newContact.name.trim()) return;
    const con: Contact = {
      id: `con-new-${Date.now()}`,
      name: newContact.name.trim(),
      role: newContact.role.trim(),
      email: newContact.email.trim(),
      phone: newContact.phone.trim(),
      isPrimary: newContact.isPrimary || account.contacts.length === 0,
    };
    const contacts = [...account.contacts, con];
    const primaryContact = con.isPrimary ? con : account.primaryContact;
    setAccount({ ...account, contacts, primaryContact });
    setNewContact({ name: "", role: "", email: "", phone: "", isPrimary: false });
    setAddContactOpen(false);
  };

  const setPrimaryContact = (contactId: string) => {
    setAccount((prev) => {
      if (!prev) return null;
      const contact = prev.contacts.find((c) => c.id === contactId);
      if (!contact) return prev;
      const contacts = prev.contacts.map((c) => ({
        ...c,
        isPrimary: c.id === contactId,
      }));
      return { ...prev, contacts, primaryContact: contact };
    });
  };

  const updateContact = (contactId: string, updates: Partial<Contact>) => {
    setAccount((prev) => {
      if (!prev) return null;
      const contacts = prev.contacts.map((c) =>
        c.id === contactId ? { ...c, ...updates } : c
      );
      const primaryContact =
        prev.primaryContact.id === contactId
          ? { ...prev.primaryContact, ...updates }
          : prev.primaryContact;
      return { ...prev, contacts, primaryContact };
    });
  };

  const startEditingContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    setEditingContactDraft({ ...contact });
  };

  const saveContactEdit = () => {
    if (!editingContactId || !editingContactDraft) return;
    updateContact(editingContactId, editingContactDraft);
    if (editingContactDraft.isPrimary) {
      setAccount((prev) => {
        if (!prev) return null;
        const contacts = prev.contacts.map((c) => ({
          ...c,
          isPrimary: c.id === editingContactId,
        }));
        return {
          ...prev,
          contacts,
          primaryContact: editingContactDraft,
        };
      });
    }
    setEditingContactId(null);
    setEditingContactDraft(null);
  };

  const cancelContactEdit = () => {
    setEditingContactId(null);
    setEditingContactDraft(null);
  };

  const handleSave = () => {
    setIsEditing(false);
    setAddContactOpen(false);
    setEditingContactId(null);
    setEditingContactDraft(null);
  };

  const handleCancel = () => {
    const next = getAccountById(id);
    setAccount(next ? cloneAccount(next) : null);
    setIsEditing(false);
    setAddContactOpen(false);
    setEditingContactId(null);
    setEditingContactDraft(null);
    setNewContact({ name: "", role: "", email: "", phone: "", isPrimary: false });
  };

  if (!account) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">Account not found.</p>
      </div>
    );
  }

  const formInput =
    "h-10 w-full rounded-density-md border border-border bg-white px-3 text-sm outline-none focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
  const formLabel = "text-sm font-medium text-gray-900 dark:text-gray-100";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full min-w-0 max-w-[1400px] p-6">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            href="/crm/customer"
            className="transition-colors hover:text-gray-900 dark:hover:text-gray-100"
          >
            Customer Management
          </Link>
          <Icon name="chevron_right" size={14} />
          <Link
            href="/crm/customer/accounts"
            className="transition-colors hover:text-gray-900 dark:hover:text-gray-100"
          >
            Account management
          </Link>
          <Icon name="chevron_right" size={14} />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {account.name}
          </span>
        </nav>

        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {account.name}
          </h1>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="md" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="md" onClick={handleSave}>
                Save
              </Button>
            </div>
          ) : (
            <Button size="md" onClick={() => setIsEditing(true)}>
              <Icon name="edit" size={18} className="mr-1.5" />
              Edit
            </Button>
          )}
        </div>

        {/* Basic information */}
        <section className="mb-8 rounded-lg border border-border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Basic information
          </h2>
          {isEditing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={formLabel}>Account name</label>
                <input
                  type="text"
                  className={formInput}
                  value={account.name}
                  onChange={(e) => updateAccount({ name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className={formLabel}>Account number</label>
                <input
                  type="text"
                  className={formInput}
                  value={account.accountNumber}
                  onChange={(e) => updateAccount({ accountNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className={formLabel}>Type</label>
                <select
                  className={formInput}
                  value={account.type}
                  onChange={(e) =>
                    updateAccount({ type: e.target.value as Account["type"] })
                  }
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={formLabel}>Status</label>
                <select
                  className={formInput}
                  value={account.status}
                  onChange={(e) =>
                    updateAccount({
                      status: e.target.value as Account["status"],
                    })
                  }
                >
                  {ACCOUNT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className={formLabel}>Address</label>
                <input
                  type="text"
                  className={formInput}
                  value={account.address}
                  onChange={(e) => updateAccount({ address: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Account name
                </span>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {account.name}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Account number
                </span>
                <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {account.accountNumber}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Type
                </span>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {account.type}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </span>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {account.status}
                </p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Address
                </span>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {account.address}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Contacts */}
        <section className="rounded-lg border border-border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Contacts ({account.contacts.length})
            </h2>
            {isEditing && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setAddContactOpen((o) => !o)}
              >
                <Icon name="add" size={18} className="mr-1.5" />
                Add contact
              </Button>
            )}
          </div>

          {isEditing && addContactOpen && (
            <form
              onSubmit={addContact}
              className="mb-6 rounded-lg border border-border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                New contact
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={formLabel}>Name</label>
                  <input
                    type="text"
                    className={formInput}
                    value={newContact.name}
                    onChange={(e) =>
                      setNewContact((c) => ({ ...c, name: e.target.value }))
                    }
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className={formLabel}>Role</label>
                  <input
                    type="text"
                    className={formInput}
                    value={newContact.role}
                    onChange={(e) =>
                      setNewContact((c) => ({ ...c, role: e.target.value }))
                    }
                    placeholder="e.g. Energy Manager"
                  />
                </div>
                <div className="space-y-1">
                  <label className={formLabel}>Email</label>
                  <input
                    type="email"
                    className={formInput}
                    value={newContact.email}
                    onChange={(e) =>
                      setNewContact((c) => ({ ...c, email: e.target.value }))
                    }
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className={formLabel}>Phone</label>
                  <input
                    type="tel"
                    className={formInput}
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact((c) => ({ ...c, phone: e.target.value }))
                    }
                    placeholder="Phone number"
                  />
                </div>
                <div className="flex items-end gap-2 sm:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newContact.isPrimary}
                      onChange={(e) =>
                        setNewContact((c) => ({
                          ...c,
                          isPrimary: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                    <span className={formLabel}>Set as primary contact</span>
                  </label>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button type="submit" size="md">
                  Add contact
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setAddContactOpen(false);
                    setNewContact({
                      name: "",
                      role: "",
                      email: "",
                      phone: "",
                      isPrimary: false,
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <ul className="space-y-3">
            {account.contacts.map((contact) => {
              const isEditingThis =
                isEditing && editingContactId === contact.id && editingContactDraft;
              return (
                <li
                  key={contact.id}
                  className="rounded-lg border border-border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  {isEditingThis ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className={formLabel}>Name</label>
                          <input
                            type="text"
                            className={formInput}
                            value={editingContactDraft.name}
                            onChange={(e) =>
                              setEditingContactDraft((d) =>
                                d ? { ...d, name: e.target.value } : null
                              )
                            }
                            placeholder="Full name"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className={formLabel}>Role</label>
                          <input
                            type="text"
                            className={formInput}
                            value={editingContactDraft.role}
                            onChange={(e) =>
                              setEditingContactDraft((d) =>
                                d ? { ...d, role: e.target.value } : null
                              )
                            }
                            placeholder="e.g. Energy Manager"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className={formLabel}>Email</label>
                          <input
                            type="email"
                            className={formInput}
                            value={editingContactDraft.email}
                            onChange={(e) =>
                              setEditingContactDraft((d) =>
                                d ? { ...d, email: e.target.value } : null
                              )
                            }
                            placeholder="email@example.com"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className={formLabel}>Phone</label>
                          <input
                            type="tel"
                            className={formInput}
                            value={editingContactDraft.phone}
                            onChange={(e) =>
                              setEditingContactDraft((d) =>
                                d ? { ...d, phone: e.target.value } : null
                              )
                            }
                            placeholder="Phone number"
                          />
                        </div>
                        <div className="flex items-end sm:col-span-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editingContactDraft.isPrimary}
                              onChange={(e) =>
                                setEditingContactDraft((d) =>
                                  d
                                    ? { ...d, isPrimary: e.target.checked }
                                    : null
                                )
                              }
                              className="h-4 w-4 rounded border-border"
                            />
                            <span className={formLabel}>Primary contact</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveContactEdit}>
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelContactEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {contact.name}
                            </p>
                            {contact.isPrimary && (
                              <span className="rounded bg-[#2C365D] px-1.5 py-0.5 text-xs font-medium text-white">
                                Primary
                              </span>
                            )}
                          </div>
                          {contact.role && (
                            <p className="text-sm text-muted-foreground">
                              {contact.role}
                            </p>
                          )}
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {contact.email && (
                              <span className="flex items-center gap-1">
                                <Icon name="mail" size={12} />
                                {contact.email}
                              </span>
                            )}
                            {contact.phone && (
                              <span className="flex items-center gap-1">
                                <Icon name="phone" size={12} />
                                {contact.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        {isEditing && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditingContact(contact)}
                            >
                              <Icon name="edit" size={14} className="mr-1" />
                              Edit
                            </Button>
                            {!contact.isPrimary && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPrimaryContact(contact.id)}
                              >
                                Set primary
                              </Button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Are you sure you want to remove ${contact.name} from this account?`
                                  )
                                ) {
                                  removeContact(contact.id);
                                }
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                              aria-label={`Remove ${contact.name}`}
                            >
                              <Icon name="delete" size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          {account.contacts.length === 0 && !addContactOpen && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No contacts yet. Add one above.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
