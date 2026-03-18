import { useState, useEffect } from "react";
import ChatList from "./ChatList";
import NewChat from "./NewChat";
import ChatRoom from "./ChatRoom"
import Profile from "./Profile"
import apiClient from "@/lib/apiClient";
import { AUTH_ROUTES } from "@/lib/constants";
import socket from "@/lib/socket";
import { useNavigate } from "react-router-dom";

const Chat = () => {
    const [view, setView] = useState("chatList")
    const [activeChat, setActiveChat] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [socketError, setSocketError] = useState("");
    const navigate = useNavigate();
    
    useEffect(() => {
        const init = async () => {
            try {
                const response = await apiClient.get(AUTH_ROUTES.USER_INFO);
                setCurrentUser(response.data);

            } catch (error) {
                console.log(error);
            }
        };
    
        init();
    }, []);

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        socket.io.opts.query = {
            userId: currentUser.id
        };

        let hasConnected = false;

        const handleConnect = () => {
            hasConnected = true;
            setSocketError("");
        }

        const handleConnectError = () => {
            setSocketError("Cannot connect to chat server.");
        }

        const handleDisconnect = () => {
            // Display disconnect error only if connection previously occurred
            if (hasConnected) {
                setSocketError("Cannot connect to chat server.");
            }
        }

        socket.on("connect", handleConnect);
        socket.on("connect_error", handleConnectError);
        socket.on("disconnect", handleDisconnect);

        socket.connect();

        return () => {
            socket.off("connect", handleConnect);
            socket.off("connect_error", handleConnectError);
            socket.off("disconnect", handleDisconnect);
            socket.disconnect();
        };
    }, [currentUser]);

    const handleUserUpdate = (updatedNames) => {
        setCurrentUser((currentUser) => ({
            ...currentUser,
            ...updatedNames
        }));
    };

    const handleLogout = async () => {
        try {
            await apiClient.post(AUTH_ROUTES.LOGOUT);
            navigate("/auth");

        } catch (error) {
            console.log(error);
            alert("Logout failed. Please try again.");
        }
    };

    if (!currentUser) {
        return <div>Loading...</div>
    }

    let content;

    if (view === "chatList") {
        content = (
            <ChatList
                onOpenNewChat={() => setView("newChat")}
                onOpenOldChat={(contact) => {
                    setActiveChat(contact);
                    setView("chatRoom")
                }}
                onOpenProfile={() => setView("profile")}
            />
        );
    }

    else if (view === "newChat") {
        content = (
            <NewChat
                onGoBack={() => setView("chatList")}
                onSelectChat={(contact) => {
                    setActiveChat(contact);
                    setView("chatRoom");
                }}
            />
        );
    }

    else if (view === "chatRoom") {
        content = (
            <ChatRoom
                contact={activeChat}
                currentUser={currentUser}
                onGoBack={() => setView("chatList")}
            />
        );
    }

    else if (view === "profile") {
        content = (
            <Profile
                currentUser={currentUser}
                onGoBack={() => setView("chatList")}
                onLogout={handleLogout}
                onUserUpdate={handleUserUpdate}
            />
        );
    }

    return (
        <div>
            {socketError && view !== "profile" && (
                <div style={{ color: "red", marginBottom: "10px" }}>
                    {socketError}
                </div>
            )}
            {content}
        </div>
    );
};

export default Chat;