import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Profile from "@/pages/chat/Profile";
import apiClient from "@/lib/apiClient";
import { AUTH_ROUTES } from "@/lib/constants";

describe("Profile Component - Unit Tests", () => {
    let originalLog;
    let onGoBackMock;
    let onLogoutMock;
    let onUserUpdateMock;
    let currentUser;

    beforeAll(() => {
        originalLog = console.log;
        console.log = jest.fn();
    });

    afterAll(() => {
        console.log = originalLog;
    });

    beforeEach(async () => {
        jest.clearAllMocks();

        onGoBackMock = jest.fn();
        onLogoutMock = jest.fn();
        onUserUpdateMock = jest.fn();

        currentUser = {
            id: "1",
            email: "user@email.com",
            firstName: "Some",
            lastName: "Guy",
        };
    });

    describe("Rendering Unit Tests", () => {
        test("renders profile view with current user information", async () => {
            render(
                <Profile
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                    onLogout={onLogoutMock}
                    onUserUpdate={onUserUpdateMock}
                />
            );

            expect(await screen.findByText("Some Guy")).toBeInTheDocument();
            expect(screen.getByText("user@email.com")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /update profile name/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
        });
    });

    describe("Navigation Callback Unit Tests", () => {
        test("calls onGoBack when back button is clicked", async () => {
            render(
                <Profile
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                    onLogout={onLogoutMock}
                    onUserUpdate={onUserUpdateMock}
                />
            );

            const backButton = await screen.findByRole("button", { name: /back/i });
            await userEvent.click(backButton);

            expect(onGoBackMock).toHaveBeenCalled();
        });

        test("calls onLogout when logout button is clicked", async () => {
            render(
                <Profile
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                    onLogout={onLogoutMock}
                    onUserUpdate={onUserUpdateMock}
                />
            );

            const logoutButton = await screen.findByRole("button", { name: /logout/i });
            await userEvent.click(logoutButton);

            expect(onLogoutMock).toHaveBeenCalled();
        });
    });

    describe("Update Mode Unit Tests", () => {
        test(`enters update mode with first and last name inputs prefilled with the current users profile name 
            when the update profile name button is clicked`, async () => {
            render(
                <Profile
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                    onLogout={onLogoutMock}
                    onUserUpdate={onUserUpdateMock}
                />
            );

            const updateButton = await screen.findByRole("button", { name: /update profile name/i });
            await userEvent.click(updateButton);

            const textboxes = screen.getAllByRole("textbox");
            const firstNameInput = textboxes[0];
            const lastNameInput = textboxes[1];

            expect(firstNameInput).toHaveValue("Some");
            expect(lastNameInput).toHaveValue("Guy");
            expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
        });

        test("updates first and last name input values when user types", async () => {
            render(
                <Profile
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                    onLogout={onLogoutMock}
                    onUserUpdate={onUserUpdateMock}
                />
            );

            const updateButton = await screen.findByRole("button", { name: /update profile name/i });
            await userEvent.click(updateButton);

            const textboxes = screen.getAllByRole("textbox");
            const firstNameInput = textboxes[0];
            const lastNameInput = textboxes[1];

            await userEvent.clear(firstNameInput);
            await userEvent.type(firstNameInput, "User");
            await userEvent.clear(lastNameInput);
            await userEvent.type(lastNameInput, "Two");

            expect(firstNameInput).toHaveValue("User");
            expect(lastNameInput).toHaveValue("Two");
        });

        test(`displays 'First and last name are required.' and does not 
            call profile update API endpoint when first or last name input is missing`, async () => {
            render(
                <Profile
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                    onLogout={onLogoutMock}
                    onUserUpdate={onUserUpdateMock}
                />
            );

            const updateButton = await screen.findByRole("button", { name: /update profile name/i });
            await userEvent.click(updateButton);

            const textboxes = screen.getAllByRole("textbox");
            const firstNameInput = textboxes[0];
            const saveButton = screen.getByRole("button", { name: /save/i });

            await userEvent.clear(firstNameInput);
            await userEvent.click(saveButton);

            expect(await screen.findByText("First and last name are required.")).toBeInTheDocument();
            expect(apiClient.post).not.toHaveBeenCalled();
        });

        test("calls profile update API endpoint with updated names when save button is clicked", async () => {
            const updatedUser = {
                id: "1",
                email: "somGuy@email.com",
                firstName: "Some",
                lastName: "Guy",
                profileSetup: true,
            };

            apiClient.post.mockResolvedValueOnce({
                data: updatedUser,
            });

            render(
                <Profile
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                    onLogout={onLogoutMock}
                    onUserUpdate={onUserUpdateMock}
                />
            );

            const updateButton = await screen.findByRole("button", { name: /update profile name/i });
            await userEvent.click(updateButton);

            const textboxes = screen.getAllByRole("textbox");
            const firstNameInput = textboxes[0];
            const lastNameInput = textboxes[1];

            await userEvent.clear(firstNameInput);
            await userEvent.type(firstNameInput, "User");
            await userEvent.clear(lastNameInput);
            await userEvent.type(lastNameInput, "Two");

            const saveButton = screen.getByRole("button", { name: /save/i });
            await userEvent.click(saveButton);

            expect(apiClient.post).toHaveBeenCalledWith(AUTH_ROUTES.UPDATE_PROFILE, {
                firstName: "User",
                lastName: "Two",
            });
        });

        test("calls onUserUpdate with response data and exits update mode after successful save", async () => {
            const updatedUser = {
                id: "2",
                email: "userTwo@email.com",
                firstName: "User",
                lastName: "Two",
                profileSetup: true,
            };

            apiClient.post.mockResolvedValueOnce({
                data: updatedUser,
            });

            render(
                <Profile
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                    onLogout={onLogoutMock}
                    onUserUpdate={onUserUpdateMock}
                />
            );

            const updateButton = await screen.findByRole("button", { name: /update profile name/i });
            await userEvent.click(updateButton);

            const textboxes = screen.getAllByRole("textbox");
            const firstNameInput = textboxes[0];
            const lastNameInput = textboxes[1];

            await userEvent.clear(firstNameInput);
            await userEvent.type(firstNameInput, "User");
            await userEvent.clear(lastNameInput);
            await userEvent.type(lastNameInput, "Two");

            const saveButton = screen.getByRole("button", { name: /save/i });
            await userEvent.click(saveButton);

            expect(onUserUpdateMock).toHaveBeenCalledWith(updatedUser);

            expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
            expect(screen.getByRole("button", { name: /update profile name/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
        });

        test("Clicks cancel button, which resets edited names, and exits update mode", async () => {
            render(
                <Profile
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                    onLogout={onLogoutMock}
                    onUserUpdate={onUserUpdateMock}
                />
            );

            const updateButton = await screen.findByRole("button", { name: /update profile name/i });
            await userEvent.click(updateButton);

            const textboxes = screen.getAllByRole("textbox");
            const firstNameInput = textboxes[0];
            const lastNameInput = textboxes[1];

            await userEvent.clear(firstNameInput);
            await userEvent.clear(lastNameInput);
            await userEvent.type(firstNameInput, "User");
            await userEvent.type(lastNameInput, "Two");

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            await userEvent.click(cancelButton);

            expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
            expect(screen.getByRole("button", { name: /update profile name/i })).toBeInTheDocument();

            const updateButton2 = screen.getByRole("button", { name: /update profile name/i });
            await userEvent.click(updateButton2);

            const textboxes2 = screen.getAllByRole("textbox");
            expect(textboxes2[0]).toHaveValue("Some");
            expect(textboxes2[1]).toHaveValue("Guy");
        });
    });

    describe("Error Handling Unit Tests", () => {
        test("displays 'Update failed. Please try again.' when update profile API returns non 400 error", async () => {
            apiClient.post.mockRejectedValueOnce({ response: { status: 500 } });

            render(
                <Profile
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                    onLogout={onLogoutMock}
                    onUserUpdate={onUserUpdateMock}
                />
            );

            const updateButton = await screen.findByRole("button", { name: /update profile name/i });
            await userEvent.click(updateButton);

            const saveButton = screen.getByRole("button", { name: /save/i });
            await userEvent.click(saveButton);

            expect(await screen.findByText("Update failed. Please try again.")).toBeInTheDocument();
        });

        test("displays 'First and last name are required.' when update profile API returns 400", async () => {
            apiClient.post.mockRejectedValueOnce({ response: { status: 400 } });

            render(
                <Profile
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                    onLogout={onLogoutMock}
                    onUserUpdate={onUserUpdateMock}
                />
            );

            const updateButton = await screen.findByRole("button", { name: /update profile name/i });
            await userEvent.click(updateButton);

            const saveButton = screen.getByRole("button", { name: /save/i });
            await userEvent.click(saveButton);

            expect(await screen.findByText("First and last name are required.")).toBeInTheDocument();
        });
    });
});
