import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Auth from "@/pages/auth/Auth";
import apiClient from "@/lib/apiClient";
import { AUTH_ROUTES } from "@/lib/constants";
import { useNavigate } from "react-router-dom";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

describe("Signup - Feature Tests", () => {
    let originalLog;
    let emailInput;
    let passwordInput;
    let confirmPasswordInput;
    let createAccountButton;
    let signupButton;

    beforeAll(() => {
        originalLog = console.log;
        console.log = jest.fn();
    });

    afterAll(() => {
        console.log = originalLog;
    });

    beforeEach(async () => {
        jest.clearAllMocks();

        render(<Auth />);
            createAccountButton = screen.getByRole("button", { name: /create new account/i });
            await userEvent.click(createAccountButton);
        
            emailInput = screen.getByPlaceholderText(/email/i);
            passwordInput = screen.getByPlaceholderText(/^password$/i);
            confirmPasswordInput = screen.getByPlaceholderText(/confirm password/i);
            signupButton = screen.getByRole("button", { name: /sign up/i });
    });

    test('successful signup navigates to chat page', async() => {
        apiClient.post.mockResolvedValue({ response: { status: 201 }});

        // User inputs valid signup credentials
        await userEvent.type(emailInput, "email@email.com");
        await userEvent.type(passwordInput, "password");
        await userEvent.type(confirmPasswordInput, "password");
        await userEvent.click(signupButton);

        expect(apiClient.post).toHaveBeenCalledWith(AUTH_ROUTES.SIGNUP, {
            email: "email@email.com",
            password: "password",
        });

        // Verify user is navigated to chat page
        expect(mockNavigate).toHaveBeenCalledWith("/chat");
    });

    test('signup failure and retry leading to succesfull signup', async () => {
        // First signup attempt fails (email already in use)
        apiClient.post.mockRejectedValueOnce({ response: { status: 409 } });

        await userEvent.type(emailInput, "used@email.com");
        await userEvent.type(passwordInput, "password");
        await userEvent.type(confirmPasswordInput, "password");
        await userEvent.click(signupButton);

        expect(screen.getByText("The email you entered is already in use.")).toBeInTheDocument();

        expect(emailInput).toHaveValue("used@email.com");
        expect(passwordInput).toHaveValue("");
        expect(confirmPasswordInput).toHaveValue("");

        // User updates email
        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, "email@email.com");

        // Second signup attempt succeeds
        apiClient.post.mockResolvedValue({ response: { status: 201 } });

        await userEvent.type(passwordInput, "password");
        await userEvent.type(confirmPasswordInput, "password");
        await userEvent.click(signupButton);

        expect(apiClient.post).toHaveBeenCalledWith(AUTH_ROUTES.SIGNUP, {
            email: "email@email.com",
            password: "password",
        });

        // Verify user is navigated to chat page
        expect(mockNavigate).toHaveBeenCalledWith("/chat");
    });
});

describe("Login - Feature Tests", () => {
    let originalLog;
    let emailInput;
    let passwordInput;
    let loginButton;
    
    beforeAll(() => {
        originalLog = console.log;
        console.log = jest.fn();
    });

    afterAll(() => {
        console.log = originalLog;
    });

    beforeEach(async () => {
        jest.clearAllMocks();

        render(<Auth />);

        emailInput = screen.getByPlaceholderText(/email/i);
        passwordInput = screen.getByPlaceholderText(/^password$/i);
        loginButton = screen.getByRole("button", { name: /log in/i });
    });

    test('successful login navigates to chat page', async() => {
        apiClient.post.mockResolvedValue({ response: { status: 200 } });

        // user inputs valid credentials
        await userEvent.type(emailInput, "email@email.com");
        await userEvent.type(passwordInput, "password");

        await userEvent.click(loginButton);

        expect(apiClient.post).toHaveBeenCalledWith(AUTH_ROUTES.LOGIN, {
            email: "email@email.com",
            password: "password",
        });

        // Verify user is navigated to chat page
        expect(mockNavigate).toHaveBeenCalledWith("/chat");
    });

    test('login failure and retry leading to successful login', async() => {
        // First login attempt fails (invalid credentials)
        apiClient.post.mockRejectedValueOnce({ response: { status: 400 } });
        
        await userEvent.type(emailInput, "email@email.com");
        await userEvent.type(passwordInput, "wrongPassword");
        await userEvent.click(loginButton);
        
        expect(screen.getByText("The login information you entered is incorrect.")).toBeInTheDocument();
        expect(emailInput).toHaveValue("email@email.com");
        expect(passwordInput).toHaveValue("");

        // User updates password
        await userEvent.type(passwordInput, "password");

        // Second login attempt succeeds
        apiClient.post.mockResolvedValue({ response: { status: 200 } });

        await userEvent.click(loginButton);

        expect(apiClient.post).toHaveBeenCalledWith(AUTH_ROUTES.LOGIN, {
            email: "email@email.com",
            password: "password",
        });

        // Verify user is navigated to chat page
        expect(mockNavigate).toHaveBeenCalledWith("/chat");
    });
}); 

