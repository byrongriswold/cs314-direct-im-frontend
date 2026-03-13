import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import apiClient from "@/lib/apiClient";
import { AUTH_ROUTES } from "@/lib/constants";

const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const verifyUser = async () => {
            try {
                await apiClient.get(AUTH_ROUTES.USER_INFO);
                setIsAuthenticated(true);
            } catch (error) {
                setIsAuthenticated(false);
            }
        };

        verifyUser();
    }, []);

    if (isAuthenticated === null) {
        return <div>Loading...</div>;
    }
    if (!isAuthenticated) {
        return <Navigate to="/auth" />;
    }
    return children;
};

export default ProtectedRoute;