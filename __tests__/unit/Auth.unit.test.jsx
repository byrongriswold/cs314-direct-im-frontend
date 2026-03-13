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

describe("Auth Component - Signup Unit Tests", () => {
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

    test('displays "Please input all fields." when all input fields are empty', async () => {
        await userEvent.click(signupButton);
        expect(screen.getByText("Please input all fields.")).toBeInTheDocument();
    });

    test('displays "Please input all fields." when one input field is empty', async () => {
        await userEvent.type(emailInput, "email@email.com");
        await userEvent.type(passwordInput, "password");
        await userEvent.click(signupButton);

        expect(screen.getByText("Please input all fields.")).toBeInTheDocument();
    });

    test('displays "Please enter a valid email address." when email input is not in valid email format', async () => {
        await userEvent.type(emailInput, "email");
        await userEvent.type(passwordInput, "password");
        await userEvent.type(confirmPasswordInput, "password");
        await userEvent.click(signupButton);

        expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
    });

    test('displays "Password must be at least 6 characters long." when password input is less than 6 characters', async () => {
        await userEvent.type(emailInput, "email@email.com");
        await userEvent.type(passwordInput, "pwd");
        await userEvent.type(confirmPasswordInput, "pwd");
        await userEvent.click(signupButton);

        expect(screen.getByText("Password must be at least 6 characters long.")).toBeInTheDocument();
    });

    test('displays "Passwords do not match." when password and confirmPassword input are not equal', async () => {
        await userEvent.type(emailInput, "email@email.com");
        await userEvent.type(passwordInput, "password");
        await userEvent.type(confirmPasswordInput, "passwor");
        await userEvent.click(signupButton);

        expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    });

    test("submits sign up when all inputs are valid", async () => {
        await userEvent.type(emailInput, "email@email.com");
        await userEvent.type(passwordInput, "password");
        await userEvent.type(confirmPasswordInput, "password");
        await userEvent.click(signupButton);

        expect(apiClient.post).toHaveBeenCalledWith(AUTH_ROUTES.SIGNUP, {
            email: "email@email.com",
            password: "password",
        });
    });

    test("navigates to login when \"back\" button is clicked", async () => {
        const backButton = screen.getByRole("button", { name: /back to login/i });

        await userEvent.click(backButton);

        expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: /create account/i })).not.toBeInTheDocument();
    });

    describe("API Error Handling - Signup Unit Tests", () => {
        test('displays "The email you entered is already in use." and clears passwords when API returns 409', async () => {
            apiClient.post.mockRejectedValue({ response: { status: 409 } });

            await userEvent.type(emailInput, "email@email.com");
            await userEvent.type(passwordInput, "password");
            await userEvent.type(confirmPasswordInput, "password");
            await userEvent.click(signupButton);

            expect(screen.getByText("The email you entered is already in use.")).toBeInTheDocument();
            expect(passwordInput).toHaveValue("");
            expect(confirmPasswordInput).toHaveValue("");
            expect(emailInput).toHaveValue("email@email.com");
        });
        
        test('displays "Please input all fields." when API returns 400', async () => {
            apiClient.post.mockRejectedValue({ response: { status: 400 } });

            await userEvent.type(emailInput, "email@email.com");
            await userEvent.type(passwordInput, "password");
            await userEvent.type(confirmPasswordInput, "password");
            await userEvent.click(signupButton);

            expect(screen.getByText("Please input all fields.")).toBeInTheDocument();
        });

        test('displays "Signup failed. Please try again." and clears inputs when API returns 500', async () => {
            apiClient.post.mockRejectedValue({ response: { status: 500 } });

            await userEvent.type(emailInput, "email@email.com");
            await userEvent.type(passwordInput, "password");
            await userEvent.type(confirmPasswordInput, "password");
            await userEvent.click(signupButton);

            expect(screen.getByText("Signup failed. Please try again.")).toBeInTheDocument();
            expect(passwordInput).toHaveValue("");
            expect(confirmPasswordInput).toHaveValue("");
            expect(emailInput).toHaveValue("");
        });

        test('displays "Unable to connect to server. Please try again later." when server does not respond', async () => {
            apiClient.post.mockRejectedValue(new Error("Connection error"));

            await userEvent.type(emailInput, "email@email.com");
            await userEvent.type(passwordInput, "password");
            await userEvent.type(confirmPasswordInput, "password");
            await userEvent.click(signupButton);

            expect(screen.getByText("Unable to connect to server. Please try again later.")).toBeInTheDocument();
        })
    });

    describe("API Success Handling - Signup Unit Test", () => {
        test('navigates to chat when signup succeeds with status 201', async () => {
            apiClient.post.mockResolvedValueOnce({ response: { status: 201 }});

            await userEvent.type(emailInput, "email@email.com");
            await userEvent.type(passwordInput, "password");
            await userEvent.type(confirmPasswordInput, "password");
            await userEvent.click(signupButton);

            expect(apiClient.post).toHaveBeenCalledWith(AUTH_ROUTES.SIGNUP, {
                email: "email@email.com",
                password: "password"
            });

            expect(mockNavigate).toHaveBeenCalledWith("/chat");
        });
    })
});

describe("Auth Component - Login Unit Tests", () => {
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

    beforeEach(() => {
        jest.clearAllMocks();
    });

    beforeEach(async () => {
        render(<Auth />);

        emailInput = screen.getByPlaceholderText(/email/i);
        passwordInput = screen.getByPlaceholderText(/^password$/i);
        loginButton = screen.getByRole("button", { name: /log in/i });
    });

    test('displays "Please input all fields." when all input fields are empty', async () => {
        await userEvent.click(loginButton);
        expect(screen.getByText("Please input all fields.")).toBeInTheDocument();
    });

    test('displays "Please input all fields." when one input field is empty', async () => {
        await userEvent.type(passwordInput, "password");
        await userEvent.click(loginButton);

        expect(screen.getByText("Please input all fields.")).toBeInTheDocument();
    });

    test("submits log in when all inputs are valid", async () => {
        await userEvent.type(emailInput, "email@email.com");
        await userEvent.type(passwordInput, "password");
        await userEvent.click(loginButton);

        expect(apiClient.post).toHaveBeenCalledWith(AUTH_ROUTES.LOGIN, {
            email: "email@email.com",
            password: "password"
        });
    });

    test("navigates to signup view when \"create new account\" button is clicked", async () => {
        const createAccountButton = screen.getByRole("button", { name: /create new account/i });

        await userEvent.click(createAccountButton);

        expect(screen.getByRole("heading", { name: /create account/i })).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: /log in/i })).not.toBeInTheDocument();
    });

    describe("API Error Handling - Login Unit Tests", () => {
        test(`displays "The login information you entered is incorrect." 
            and clears password when API responds with a non-500 error`, async () => {
                apiClient.post.mockRejectedValue({ response: { status: 400 } });

                await userEvent.type(emailInput, "email@email.com");
                await userEvent.type(passwordInput, "password");
                await userEvent.click(loginButton);

            expect(screen.getByText("The login information you entered is incorrect.")).toBeInTheDocument();
            expect(emailInput).toHaveValue("email@email.com");
            expect(passwordInput).toHaveValue("");
        });

        test('displays "Server error. Please try again later." and clears password when API returns 500', async () => {
            apiClient.post.mockRejectedValue({ response: { status: 500 } });

            await userEvent.type(emailInput, "email@email.com");
            await userEvent.type(passwordInput, "password");
            await userEvent.click(loginButton);

            expect(screen.getByText("Server error. Please try again later.")).toBeInTheDocument();
            expect(emailInput).toHaveValue("email@email.com");
            expect(passwordInput).toHaveValue("");
        })
    });

    describe("API Success Handling - Login Unit Test", () => {
        test('navigates to chat when login succeeds with status 200', async () => {
            apiClient.post.mockResolvedValueOnce({ response: { status: 200 }});

            await userEvent.type(emailInput, "email@email.com");
            await userEvent.type(passwordInput, "password");
            await userEvent.click(loginButton);

            expect(apiClient.post).toHaveBeenCalledWith(AUTH_ROUTES.LOGIN, {
                email: "email@email.com",
                password: "password"
            });

            expect(mockNavigate).toHaveBeenCalledWith("/chat");
        });
    })
});
