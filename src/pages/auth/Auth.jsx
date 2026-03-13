import { useState } from "react";
import apiClient from "@/lib/apiClient";
import { AUTH_ROUTES } from "@/lib/constants";
import { useNavigate } from "react-router-dom";

const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    const handleSignup = async () => {
        if (email === "" || password === "" || confirmPassword === "") {
            setMessage("Please input all fields.");
            return;
        }
        if (!email.includes("@")) {
            setMessage("Please enter a valid email address.");
            return;
        }

        if (password.length < 6) {
            setMessage("Password must be at least 6 characters long.");
            
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        try {
            await apiClient.post(
                AUTH_ROUTES.SIGNUP,
                {
                    email,
                    password
                },
            );
            
            navigate("/chat");
        } catch (error) {
            console.log(error);

            if (!error.response) {
                setMessage("Unable to connect to server. Please try again later.");
                return;
            }

            const status = error.response?.status

            if (status === 409) {
                setMessage("The email you entered is already in use.");
                setPassword("");
                setConfirmPassword("");
                return;
            } else if (status === 400) {
                setMessage("Please input all fields.")
                return;
            }

            setMessage("Signup failed. Please try again.")
            setEmail("");
            setPassword("");
            setConfirmPassword("");
        }
    };

    const handleLogin = async () => {
        if (email === "" || password === "") {
            setMessage("Please input all fields.");
            return;
        }

        let attempt = 0;
        const maxAttempts = 3;

        while (attempt < maxAttempts) {
            try {
                await apiClient.post(AUTH_ROUTES.LOGIN, { email, password });
                navigate("/chat");
                return;
            } catch (error) {
            console.log(error);
            attempt += 1;

            const isNetworkError = !error.response;
            const hasAttemptsRemaining = attempt < maxAttempts;

            if (isNetworkError && hasAttemptsRemaining) {
                setMessage("Connection issue. Retrying login...");
                await new Promise((resolve) => setTimeout(resolve, 700));
                continue;
            }

            if (isNetworkError) {
                setMessage("Unable to connect to server. Please try again later.");
                return;
            }

            if (error.response.status === 500) {
                setMessage("Server error. Please try again later.");
            } else {
                setMessage("The login information you entered is incorrect.");
            }

            setPassword("");
            return;
            }
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f3f4f6"
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    backgroundColor: "white",
                    padding: "40px",
                    borderRadius: "16px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    textAlign: "center"
                }}
            >
                <div
                    style={{
                        fontSize: "32px",
                        fontWeight: "800",
                        fontStyle: "italic",
                        letterSpacing: "-0.5px",
                        marginBottom: "25px"
                    }}
                >
                    <span style={{ color: "#111827" }}>Direct</span>
                    <span style={{ color: "#2563eb" }}>IM</span>
                </div>

                {isLogin ? (
                    <>
                        <h1 style={{ fontSize: "22px", marginBottom: "20px" }}>
                            Log In
                        </h1>

                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginBottom: "15px",
                                borderRadius: "8px",
                                border: "1px solid #d1d5db",
                                fontSize: "14px"
                            }}
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginBottom: "15px",
                                borderRadius: "8px",
                                border: "1px solid #d1d5db",
                                fontSize: "14px"
                            }}
                        />

                        <button
                            onClick={handleLogin}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: "#2563eb",
                                color: "white",
                                fontWeight: "600",
                                marginBottom: "10px",
                                cursor: "pointer"
                            }}
                        >
                            Log In
                        </button>

                        <button
                            onClick={() => {
                                setIsLogin(false);
                                setMessage("");
                            }}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                backgroundColor: "#f9fafb",
                                cursor: "pointer"
                            }}
                        >
                            Create New Account
                        </button>
                    </>
                ) : (
                    <>
                        <h1 style={{ fontSize: "22px", marginBottom: "20px" }}>
                            Create Account
                        </h1>

                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginBottom: "15px",
                                borderRadius: "8px",
                                border: "1px solid #d1d5db",
                                fontSize: "14px"
                            }}
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginBottom: "15px",
                                borderRadius: "8px",
                                border: "1px solid #d1d5db",
                                fontSize: "14px"
                            }}
                        />

                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginBottom: "15px",
                                borderRadius: "8px",
                                border: "1px solid #d1d5db",
                                fontSize: "14px"
                            }}
                        />

                        <button
                            onClick={handleSignup}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: "#2563eb",
                                color: "white",
                                fontWeight: "600",
                                marginBottom: "10px",
                                cursor: "pointer"
                            }}
                        >
                            Sign Up
                        </button>

                        <button
                            onClick={() => {
                                setIsLogin(true);
                                setMessage("");
                            }}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                backgroundColor: "#f9fafb",
                                cursor: "pointer"
                            }}
                        >
                            ← Back to Login
                        </button>
                    </>
                )}

                {message && (
                    <p style={{ marginTop: "20px", color: "#dc2626" }}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Auth;