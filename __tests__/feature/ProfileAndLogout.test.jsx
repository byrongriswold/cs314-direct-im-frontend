import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Chat from "@/pages/chat/Chat";
import apiClient from "@/lib/apiClient";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

describe("Update Profile Name - Feature Tests", () => {
    let originalLog;

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

    test("user updates profile name successfully from profile view", async () => {
        apiClient.get
            .mockResolvedValueOnce({
                data: {
                    id: "1",
                    email: "someGuy@email.com",
                    firstName: "Some",
                    lastName: "Guy",
                },
            }) // current user info
            .mockResolvedValueOnce({
                data: { contacts: [] },
            }); // chat list

        apiClient.post.mockResolvedValueOnce({
            data: {
                id: "1",
                email: "someGuy@email.com",
                firstName: "User",
                lastName: "Two",
                profileSetup: true,
            },
        }); // updated user info

        render(<Chat />);

        await userEvent.click(await screen.findByRole("button", { name: /profile/i }));
        expect(await screen.findByText("Some Guy")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /update profile name/i }));

        const textboxes = screen.getAllByRole("textbox");
        await userEvent.clear(textboxes[0]);
        await userEvent.type(textboxes[0], "User");
        await userEvent.clear(textboxes[1]);
        await userEvent.type(textboxes[1], "Two");

        await userEvent.click(screen.getByRole("button", { name: /save/i }));

        expect(await screen.findByText("User Two")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /update profile name/i })).toBeInTheDocument();
    });

    test("updated profile name remains when user leaves profile view and returns", async () => {
        apiClient.get
            .mockResolvedValueOnce({
                data: {
                    id: "1",
                    email: "someGuy@email.com",
                    firstName: "Some",
                    lastName: "Guy",
                },
            }) // current user info
            .mockResolvedValueOnce({
                data: { contacts: [] },
            }) // first chat list 
            .mockResolvedValueOnce({
                data: { contacts: [] },
            }); // second chat list

        apiClient.post.mockResolvedValueOnce({
            data: {
                id: "1",
                email: "someGuy@email.com",
                firstName: "User",
                lastName: "Two",
                profileSetup: true,
            },
        }); // updated user info

        render(<Chat />);

        await userEvent.click(await screen.findByRole("button", { name: /profile/i }));
        await userEvent.click(screen.getByRole("button", { name: /update profile name/i }));

        const textboxes = screen.getAllByRole("textbox");
        await userEvent.clear(textboxes[0]);
        await userEvent.type(textboxes[0], "User");
        await userEvent.clear(textboxes[1]);
        await userEvent.type(textboxes[1], "Two");

        await userEvent.click(screen.getByRole("button", { name: /save/i }));
        expect(await screen.findByText("User Two")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /back/i }));
        expect(await screen.findByText("Chats")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /profile/i }));
        expect(await screen.findByText("User Two")).toBeInTheDocument();
    });
});

describe("User Logout - Feature Tests", () => {
    let originalLog;

    beforeAll(() => {
        originalLog = console.log;
        console.log = jest.fn();

        Object.defineProperty(window, "scrollTo", {
            value: jest.fn(),
            writable: true,
        });
    });

    afterAll(() => {
        console.log = originalLog;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("user opens profile and logs out, then gets navigated back to auth page", async () => {
        apiClient.get
            .mockResolvedValueOnce({
                data: {
                    id: "1",
                    email: "someGuy@email.com",
                    firstName: "Some",
                    lastName: "Guy",
                },
            }) // current user info
            .mockResolvedValueOnce({
                data: { contacts: [] },
            }); // chat list

        apiClient.post.mockResolvedValueOnce({ response: { status: 200 } });

        render(<Chat />);

        expect(await screen.findByText("Chats")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /profile/i }));
        expect(await screen.findByRole("button", { name: /logout/i })).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /logout/i }));

        expect(mockNavigate).toHaveBeenCalledWith("/auth");
    });

    test("when logout fails, alert is displayed", async () => {
        apiClient.get
            .mockResolvedValueOnce({
                data: {
                    id: "1",
                    email: "someGuy@email.com",
                    firstName: "Some",
                    lastName: "Guy",
                },
            }) // current user info
            .mockResolvedValueOnce({
                data: { contacts: [] },
            }); // chat list

        apiClient.post.mockRejectedValueOnce({ response: { status: 500 } });

        const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

        render(<Chat />);

        expect(await screen.findByText("Chats")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /profile/i }));
        expect(await screen.findByRole("button", { name: /logout/i })).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /logout/i }));

        expect(alertSpy).toHaveBeenCalledWith("Logout failed. Please try again.");
        expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalledWith("/auth");

        alertSpy.mockRestore();
    });
});

