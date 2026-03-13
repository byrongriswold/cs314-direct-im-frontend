import { useState } from "react";
import apiClient from "@/lib/apiClient";
import { CONTACT_ROUTES } from "@/lib/constants";

const NewChat = ({ onGoBack, onSelectChat }) => {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = async (term) => {
    setSearchTerm(term);

    if (term.trim() === "") {
      setContacts([]);
      return;
    }

    try {
      const response = await apiClient.post(
        CONTACT_ROUTES.SEARCH,
        { searchTerm: term }
      );

      const formattedContacts = response.data.contacts.map(account => ({
        id: account._id,
        name: `${account.firstName ?? ""} ${account.lastName ?? ""}`.trim(),
        email: account.email
      }));

      setContacts(formattedContacts);
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          position: "relative"
        }}
      >
        <button
          onClick={onGoBack}
          style={{
            position: "absolute",
            left: "-95px",
            top: "-4px",
            backgroundColor: "transparent",
            border: "none",
            fontSize: "14px",
            cursor: "pointer",
            color: "#2563eb",
            fontWeight: "600"
          }}
        >
          ← Back
        </button>

        <h2
          style={{
            margin: 0,
            fontSize: "32px",
            fontWeight: "800"
          }}
        >
          New Chat
        </h2>

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

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search name or email"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            fontSize: "15px",
            outline: "none"
          }}
        />
      </div>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          overflow: "hidden",
          backgroundColor: "white"
        }}
      >
        {searchTerm.trim() !== "" && contacts.length === 0 && (
          <div style={{ padding: "16px", color: "#6b7280" }}>
            No results
          </div>
        )}

        {contacts.map((contact, index) => {
          const hasName = !!contact.name;

          return (
            <div
              key={contact.id}
              onClick={() => onSelectChat(contact)}
              style={{
                padding: "16px 20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "18px",
                borderBottom:
                  index !== contacts.length - 1
                    ? "1px solid #f1f5f9"
                    : "none"
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f9fafb")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "white")
              }
            >
              <div
                style={{
                  fontWeight: "700",
                  fontSize: "16px"
                }}
              >
                {hasName ? contact.name : contact.email}
              </div>

              {hasName && (
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6b7280"
                  }}
                >
                  {contact.email}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NewChat;