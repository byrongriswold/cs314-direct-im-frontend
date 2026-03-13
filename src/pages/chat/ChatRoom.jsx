import { useEffect, useState, useRef } from "react";
import apiClient from "@/lib/apiClient";
import { GET_MESSAGE_ROUTE } from "@/lib/constants";
import socket from "@/lib/socket";

const ChatRoom = ({ contact, currentUser, onGoBack}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const bottomRef = useRef(null);

const MAX_MESSAGE_LEN = 500;

  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await apiClient.post(
          GET_MESSAGE_ROUTE,
          { id: contact.id }
        );

        const formatted = response.data.messages.map(({_id, sender, recipient, ...rest}) => ({
          id: _id,
          sender: { id: sender },
          recipient: { id: recipient },
          ...rest
        }));

        setMessages(formatted);
      } catch (error) {
        console.log(error);
      }
    };

    getMessages();
  }, [contact.id]);

  useEffect(() => {
    const handleReceiving = (message) => {
      const formatMessage = ({_id, sender, recipient, ...rest}) => ({
        id: _id,
        ...rest,
        sender: { id: sender._id },
        recipient: { id: recipient._id }
      });

      const formatted = formatMessage(message);

      if (formatted.sender.id === contact.id || formatted.recipient.id === contact.id) {
        setMessages((prevMessages) => [...prevMessages, formatted]);
      }
    };

    socket.on("receiveMessage", handleReceiving)

    return () => {
      socket.off("receiveMessage", handleReceiving);
    };
  }, [contact.id]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollTop = bottomRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSending = () => {
    if (newMessage.trim() === "") {
      return;
    }

    setErrorMessage("");

    if (newMessage.length > MAX_MESSAGE_LEN) {
        setErrorMessage(`Message is too long. Maximum ${MAX_MESSAGE_LEN}  characters.`);
      return;
    }

    socket.emit("sendMessage", {
      sender: currentUser.id,
      recipient: contact.id,
      content: newMessage,
      messageType:"text"
    });

    setNewMessage("");
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
          marginBottom: "30px",
          position: "relative"
        }}
      >
        {/* Back Button */}
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

        {/* Empty spacer (keeps title centered) */}
        <div />

        {/* Logo */}
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

      {/* Contact Name Centered */}
      <div
        style={{
          textAlign: "center",
          fontSize: "22px",
          fontWeight: "700",
          marginBottom: "25px"
        }}
      >
        {contact.name
          ? contact.name
          : (contact.firstName || contact.lastName)
          ? `${contact.firstName || ""} ${contact.lastName || ""}`
          : contact.email}
      </div>

      {/* Message Container */}
      <div
        ref={bottomRef}
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          minHeight: "350px",
          maxHeight: "500px",
          overflowY: "auto",
          padding: "20px",
          marginBottom: "20px",
          backgroundColor: "white"
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#6b7280" }}>
            No messages
          </div>
        )}

        {messages.map((message) => {
          const isCurrentUser = message.sender.id === currentUser.id;

          const formattedTime = new Date(
            message.timestamp
          ).toLocaleString([], {
            hour: "2-digit",
            minute: "2-digit",
            month: "short",
            day: "numeric"
          });

          return (
            <div
              key={message.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isCurrentUser ? "flex-end" : "flex-start",
                marginBottom: "18px"
              }}
            >
              {/* Timestamp */}
              <div
                style={{
                  fontSize: "11px",
                  color: "#9ca3af",
                  marginBottom: "4px"
                }}
              >
                {formattedTime}
              </div>

              {/* Message Bubble */}
              <div
                style={{
                  backgroundColor: isCurrentUser ? "#2563eb" : "#f3f4f6",
                  color: isCurrentUser ? "white" : "black",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  maxWidth: "66%",
                  wordWrap: "break-word"
                }}
              >
                {message.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div
        style={{
          display: "flex",
          gap: "12px"
        }}
      >
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
            outline: "none"
          }}
        />

        <button
          onClick={handleSending}
          style={{
            padding: "12px 20px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Send
        </button>
      </div>

      {errorMessage && (
        <div style={{ color: "#dc2626", marginBottom: "10px", fontSize: "14px" }}>
          {errorMessage}
        </div>
      )}
      
    </div>
  );
};

export default ChatRoom;