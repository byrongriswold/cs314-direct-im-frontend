import apiClient from "@/lib/apiClient";
import { AUTH_ROUTES } from "@/lib/constants";
import { useEffect, useState } from "react";

const Profile = ({ currentUser, onGoBack, onLogout, onUserUpdate }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        setFirstName(currentUser.firstName || "");
        setLastName(currentUser.lastName || "");
    }, [currentUser]);

    const handleProfileUpdate = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            setMessage("First and last name are required.");
            return;
        }

        try {
            const response = await apiClient.post(AUTH_ROUTES.UPDATE_PROFILE, {
                firstName,
                lastName,
            });

            setMessage("");
            onUserUpdate(response.data);
            setIsUpdating(false);

        } catch (error) {
            console.log(error);
            const status = error.response?.status;

            if (status === 400) {
                setMessage("First and last name are required.");
            } else {
                setMessage("Update failed. Please try again.");
            }
        }
    };

    const fullName = firstName && lastName
        ? `${firstName} ${lastName}`
        : "";

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
                marginBottom: "40px",
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

            {/* Profile Info */}
            <div
            style={{
                textAlign: "center",
                marginTop: "40px",
                marginBottom: "40px"
            }}
            >
            {fullName && (
                <div
                style={{
                    fontSize: "34px",
                    fontWeight: "800",
                    marginBottom: "10px"
                }}
                >
                {fullName}
                </div>
            )}

            <div
                style={{
                fontSize: "16px",
                color: "#6b7280"
                }}
            >
                {currentUser.email}
            </div>
            </div>

            {message && (
            <div
                style={{
                textAlign: "center",
                marginBottom: "20px",
                color: "#dc2626",
                fontSize: "14px"
                }}
            >
                {message}
            </div>
            )}

            {isUpdating ? (
            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
                {/* Side-by-side inputs */}
                <div
                style={{
                    display: "flex",
                    gap: "15px",
                    marginBottom: "20px"
                }}
                >
                <input
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px"
                    }}
                />

                <input
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px"
                    }}
                />
                </div>

                {/* Smaller centered buttons */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "12px"
                    }}
                >
                    <button
                        onClick={handleProfileUpdate}
                        style={{
                        padding: "10px 22px",
                        borderRadius: "10px",
                        border: "none",
                        backgroundColor: "#2563eb",
                        color: "white",
                        fontWeight: "600",
                        cursor: "pointer"
                        }}
                    >
                        Save
                    </button>

                    <button
                        onClick={() => {
                        setFirstName(currentUser.firstName || "");
                        setLastName(currentUser.lastName || "");
                        setMessage("");
                        setIsUpdating(false);
                        }}
                        style={{
                        padding: "10px 22px",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        backgroundColor: "#f9fafb",
                        cursor: "pointer"
                        }}
                    >
                        Cancel
                    </button>
                </div>    
            </div>
            ) : (
            <div
                style={{
                maxWidth: "400px",
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                gap: "15px"
                }}
            >
                <button
                onClick={() => setIsUpdating(true)}
                style={{
                    padding: "14px",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer"
                }}
                >
                Update Profile Name
                </button>

                <button
                onClick={onLogout}
                style={{
                    padding: "14px",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#ef4444",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer"
                }}
                >
                Logout
                </button>
            </div>
            )}
        </div>
    );
};

export default Profile;
