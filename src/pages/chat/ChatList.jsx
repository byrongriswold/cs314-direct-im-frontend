import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { CONTACT_ROUTES } from "@/lib/constants";

const ChatList = ({ onOpenNewChat, onOpenOldChat, onOpenProfile }) => {
    const [contacts, setContacts] = useState([]);

    useEffect(() => {
        const getContacts = async () => {
            try {
                const response = await apiClient.get(CONTACT_ROUTES.LIST);
                const formattedContacts = response.data.contacts.map(({_id, ...rest}) => ({
                    id: _id,
                    ...rest
                }));
                setContacts(formattedContacts);
            } catch (error) {
                console.log(error);
            }
        };

        getContacts();
    }, []);

    const handleDelete = async (contactID) => {
        const confirm_deletion = window.confirm("Are you sure you want to delete this chat?");
        if (!confirm_deletion) {
            return;
        }

        try {
            await apiClient.delete(`${CONTACT_ROUTES.DELETE}${contactID}`);
            setContacts((contacts) => 
                contacts.filter((contact) => contact.id !== contactID)
            );

        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div
            style={{
                maxWidth: "850px",
                margin: "40px auto",
                padding: "0 40px"
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "30px"
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: "32px",
                        fontWeight: "800"
                    }}
                >
                    Chats
                </h2>

                <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                    <button
                        onClick={onOpenProfile}
                        style={{
                            backgroundColor: "#2563eb",
                            color: "white",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "10px",
                            fontWeight: "600",
                            fontSize: "14px",
                            cursor: "pointer"
                        }}
                    >
                        Profile
                    </button>

                    {/* Small Logo */}
                    <div
                        style={{
                            fontSize: "18px",
                            fontWeight: "800",
                            fontStyle: "italic",
                            letterSpacing: "-0.5px"
                        }}
                    >
                        <span style={{ color: "#111827" }}>Direct</span>
                        <span style={{ color: "#2563eb" }}>IM</span>
                    </div>
                </div>
            </div>

            {/* New Chat Button */}
            <button
                onClick={onOpenNewChat}
                style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "white",
                    fontWeight: "600",
                    fontSize: "15px",
                    cursor: "pointer",
                    marginBottom: "25px"
                }}
            >
                + New Chat
            </button>

            {contacts.length === 0 && (
                <p style={{ color: "#6b7280", fontSize: "15px" }}>
                    No chats
                </p>
            )}

            {contacts.map((contact) => {
                const displayName =
                    contact.firstName || contact.lastName
                        ? `${contact.firstName || ""} ${contact.lastName || ""}`
                        : contact.email;

                const formattedTime = new Date(
                    contact.lastMessageTime
                ).toLocaleString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric"
                });

                return (
                    <div
                        key={contact.id}
                        style={{
                            display: "flex",
                            alignItems: "stretch",
                            borderRadius: "14px",
                            border: "1px solid #e5e7eb",
                            backgroundColor: "#ffffff",
                            marginBottom: "12px",
                            overflow: "hidden"
                        }}
                    >
                        {/* Chat Info */}
                        <div
                            onClick={() => onOpenOldChat(contact)}
                            style={{
                                flex: 1,
                                padding: "18px 22px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "20px"
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = "#f9fafb")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = "#ffffff")
                            }
                        >
                            <div
                                style={{
                                    fontWeight: "700",
                                    fontSize: "16px"
                                }}
                            >
                                {displayName}
                            </div>

                            <div
                                style={{
                                    fontSize: "13px",
                                    color: "#6b7280"
                                }}
                            >
                                {formattedTime}
                            </div>
                        </div>

                        {/* Divider + Delete */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                borderLeft: "1px solid #e5e7eb",
                                padding: "0 18px",
                                backgroundColor: "#fafafa"
                            }}
                        >
                            <button
                                onClick={() => handleDelete(contact.id)}
                                style={{
                                    backgroundColor: "transparent",
                                    border: "none",
                                    color: "#dc2626",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    cursor: "pointer"
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ChatList;