import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import socket from "@/lib/socket";
import Chat from "@/pages/chat/Chat";
import apiClient from "@/lib/apiClient";
import { AUTH_ROUTES } from "@/lib/constants";

const mockNavigate = jest.fn();

const mockChatList = jest.fn(() => <div />);
const mockNewChat = jest.fn(() => <div />);
const mockChatRoom = jest.fn(() => <div />);
const mockProfile = jest.fn(() => <div />);

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

jest.mock("@/lib/socket", () => ({
    __esModule: true,
    default: {
        io: { opts: { query: {} } },
        on: jest.fn(),
        off: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
    },
}));

jest.mock("@/pages/chat/ChatList", () => (props) => mockChatList(props));
jest.mock("@/pages/chat/NewChat", () => (props) => mockNewChat(props));
jest.mock("@/pages/chat/ChatRoom", () => (props) => mockChatRoom(props));
jest.mock("@/pages/chat/Profile", () => (props) => mockProfile(props));

describe("Chat Component - Unit Tests", () => {
    let originalLog;

    beforeAll(() => {
        originalLog = console.log;
        console.log = jest.fn();
    });

    afterAll(() => {
        console.log = originalLog;
    });

    beforeEach(async () => {
        jest.clearAllMocks();
    });

    describe("Initial Mount Unit Tests", () => {
        test("displays 'Loading..' on first mount", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: { id: "1", email: "someGuy@email.com", firstName: "Some", lastName: "Guy" },
            });

            render(<Chat />);

            expect(screen.getByText("Loading...")).toBeInTheDocument();

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalled();
            });
        });

        test("calls user info  API endpoint on mount", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: { id: "1", email: "someGuy@email.com", firstName: "Some", lastName: "Guy" },
            });

            render(<Chat />);

            await waitFor(() => {
                expect(apiClient.get).toHaveBeenCalledWith(AUTH_ROUTES.USER_INFO);
            });
        });

        test("renders ChatList view after user info API endpoint call succeeds", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: { id: "1", email: "someGuy@email.com", firstName: "Some", lastName: "Guy" },
            });

            render(<Chat />);

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalled();
            });
        });

        test("handles user info API endpoint call failure by logging error and remaining in loading state", async () => {
            apiClient.get.mockRejectedValueOnce({ response: { status: 500 } });

            render(<Chat />);

            await waitFor(() => {
                expect(apiClient.get).toHaveBeenCalledWith(AUTH_ROUTES.USER_INFO);
            });

            expect(screen.getByText("Loading...")).toBeInTheDocument();
            expect(console.log).toHaveBeenCalledWith({ response: { status: 500 } });
            expect(mockChatList).not.toHaveBeenCalled();
        });
    });

    describe("View Switching Unit Tests", () => {
        test("switches to NewChat view when ChatList onOpenNewChat callback is triggered", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: { id: "1", email: "someGuy@email.com", firstName: "Some", lastName: "Guy" },
            });

            render(<Chat />);

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalled();
            });

            const chatListProps = mockChatList.mock.calls[0][0];
            await act(async () => {
                chatListProps.onOpenNewChat();
            });

            await waitFor(() => {
                expect(mockNewChat).toHaveBeenCalled();
            });
        });

        test("switches to Profile view when ChatList onOpenProfile callback is triggered", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: { id: "1", email: "someGuy@email.com", firstName: "Some", lastName: "Guy" },
            });

            render(<Chat />);

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalled();
            });

            const chatListProps = mockChatList.mock.calls[0][0];
            await act(async () => {
                chatListProps.onOpenProfile();
            });

            await waitFor(() => {
                expect(mockProfile).toHaveBeenCalled();
            });
        });

        test("switches to ChatRoom view and sets active chat when ChatList onOpenOldChat callback is triggered", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: { id: "1", email: "someGuy@email.com", firstName: "Some", lastName: "Guy" },
            });

            render(<Chat />);

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalled();
            });

            const chatListProps = mockChatList.mock.calls[0][0];
            const selectedContact = { id: "2", firstName: "User", lastName: "Two", email: "userTwo@email.com" };
            
            await act(async () => {
                chatListProps.onOpenOldChat(selectedContact);
            });

            await waitFor(() => {
                expect(mockChatRoom).toHaveBeenCalled();
            });

            const chatRoomProps = mockChatRoom.mock.calls[0][0];
            expect(chatRoomProps.contact).toEqual(selectedContact);
        });

        test("switches to ChatRoom view and sets active chat when NewChat onSelectChat is triggered", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: { id: "1", email: "someGuy@email.com", firstName: "Some", lastName: "Guy" },
            });

            render(<Chat />);

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalled();
            });

            const chatListProps = mockChatList.mock.calls[0][0];
            await act(async () => {
                chatListProps.onOpenNewChat();
            });

            await waitFor(() => {
                expect(mockNewChat).toHaveBeenCalled();
            });

            const newChatProps = mockNewChat.mock.calls[0][0];
            const contact = { id: "2", name: "User Two", email: "userTwo@email.com" };

            await act(async () => {
                newChatProps.onSelectChat(contact);
            });

            await waitFor(() => {
                expect(mockChatRoom).toHaveBeenCalled();
            });

            const chatRoomProps = mockChatRoom.mock.calls[0][0];
            expect(chatRoomProps.contact).toEqual(contact);
        });


        test("returns to ChatList view when NewChat onGoBack callback is triggered", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: { id: "1", email: "someGuy@email.com", firstName: "Some", lastName: "Guy" },
            });

            render(<Chat />);

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalled();
            });

            const chatListProps = mockChatList.mock.calls[0][0];
            await act(async () => {
                chatListProps.onOpenNewChat();
            });

            await waitFor(() => {
                expect(mockNewChat).toHaveBeenCalled();
            });

            const newChatProps = mockNewChat.mock.calls[0][0];
            await act(async () => {
                newChatProps.onGoBack();
            });

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalledTimes(2);
            });
        });

        test("returns to ChatList view when ChatRoom onGoBack callback is triggered", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: { id: "1", email: "someGuy@email.com", firstName: "Some", lastName: "Guy" },
            });

            render(<Chat />);

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalled();
            });

            const chatListProps = mockChatList.mock.calls[0][0];
            await act(async () => {
                chatListProps.onOpenOldChat({
                id: "2",
                firstName: "User",
                lastName: "Two",
                email: "userTwo@email.com",
                });
            });

            await waitFor(() => {
                expect(mockChatRoom).toHaveBeenCalled();
            });

            const chatRoomProps = mockChatRoom.mock.calls[0][0];
            await act(async () => {
                chatRoomProps.onGoBack();
            });

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalledTimes(2);
            });
        });

        test("returns to ChatList view when Profile onGoBack callback is triggered", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: { id: "1", email: "someGuy@email.com", firstName: "Some", lastName: "Guy" },
            });

            render(<Chat />);

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalled();
            });

            const chatListProps = mockChatList.mock.calls[0][0];
            await act(async () => {
                chatListProps.onOpenProfile();
            });

            await waitFor(() => {
                expect(mockProfile).toHaveBeenCalled();
            });

            const profileProps = mockProfile.mock.calls[0][0];
            await act(async () => {
                profileProps.onGoBack();
            });

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe("Profile Callback and Logout Unit Tests", () => {
        test("updates currentUser state when Profile onUserUpdate callback is triggered", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: {
                    id: "1",
                    email: "someGuy@email.com",
                    firstName: "Some",
                    lastName: "Guy",
                },
            });

            render(<Chat />);

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalled();
            });

            const chatListProps = mockChatList.mock.calls[0][0];
            await act(async () => {
                chatListProps.onOpenProfile();
            });

            await waitFor(() => {
                expect(mockProfile).toHaveBeenCalled();
            });

            const firstProfileProps = mockProfile.mock.calls[0][0];
            await act(async () => {
                firstProfileProps.onUserUpdate({ firstName: "User", lastName: "Two" });
            });

            await waitFor(() => {
                expect(mockProfile).toHaveBeenCalledTimes(2);
            });

            const secondProfileProps = mockProfile.mock.calls[1][0];
            expect(secondProfileProps.currentUser).toEqual({
                id: "1",
                email: "someGuy@email.com",
                firstName: "User",
                lastName: "Two",
            });
        });

        test("calls logout API endpoint and navigates to /auth when Profile onLogout callback is triggered", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: {
                    id: "1",
                    email: "someGuy@email.com",
                    firstName: "Some",
                    lastName: "Guy",
                },
            });

            apiClient.post.mockResolvedValueOnce({ response: { status: 200 } });

            render(<Chat />);

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalled();
            });

            const chatListProps = mockChatList.mock.calls[0][0];
            await act(async () => {
                chatListProps.onOpenProfile();
            });

            await waitFor(() => {
                expect(mockProfile).toHaveBeenCalled();
            });

            const profileProps = mockProfile.mock.calls[0][0];
            await profileProps.onLogout();

            expect(apiClient.post).toHaveBeenCalledWith(AUTH_ROUTES.LOGOUT);
            expect(mockNavigate).toHaveBeenCalledWith("/auth");
        });

        test("logs error and shows alert when logout API call fails", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: {
                    id: "1",
                    email: "someGuy@email.com",
                    firstName: "Some",
                    lastName: "Guy",
                },
            });

            apiClient.post.mockRejectedValueOnce({ response: { status: 500 } });

            const alert = jest.spyOn(window, "alert").mockImplementation(() => {});

            render(<Chat />);

            await waitFor(() => {
                expect(mockChatList).toHaveBeenCalled();
            });

            const chatListProps = mockChatList.mock.calls[0][0];
            await act(async () => {
                chatListProps.onOpenProfile();
            });

            await waitFor(() => {
                expect(mockProfile).toHaveBeenCalled();
            });

            const profileProps = mockProfile.mock.calls[0][0];
            await profileProps.onLogout();

            expect(apiClient.post).toHaveBeenCalledWith(AUTH_ROUTES.LOGOUT);
            expect(console.log).toHaveBeenCalledWith({ response: { status: 500 } });
            expect(alert).toHaveBeenCalledWith("Logout failed. Please try again.");

            alert.mockRestore();
        });
    });

    describe("Socket Connection Unit Tests", () => {
        test("sets socket query userId and calls connect after current user is set", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: {
                    id: "1",
                    email: "someGuy@email.com",
                    firstName: "Some",
                    lastName: "Guy",
                },
            });

            render(<Chat />);

            await waitFor(() => {
                expect(socket.connect).toHaveBeenCalled();
            });

            expect(socket.io.opts.query).toEqual({ userId: "1" });
        });

        test("disconnects socket on unmount", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: {
                    id: "1",
                    email: "someGuy@email.com",
                    firstName: "Some",
                    lastName: "Guy",
                },
            });

            const { unmount } = render(<Chat />);

            await waitFor(() => {
                expect(socket.connect).toHaveBeenCalled();
            });

            unmount();
            expect(socket.disconnect).toHaveBeenCalled();
        });

        test("displays 'Cannot connect to chat server.' when connect_error handler is triggered", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: {
                    id: "1",
                    email: "someGuy@email.com",
                    firstName: "Some",
                    lastName: "Guy",
                },
            });

            render(<Chat />);

            await waitFor(() => {
                expect(socket.on).toHaveBeenCalledWith("connect_error", expect.any(Function));
            });

            const connectErrorHandler = socket.on.mock.calls.find(
                ([event]) => event === "connect_error"
            )[1];

            await act(async () => {
                connectErrorHandler();
            });

            expect(screen.getByText("Cannot connect to chat server.")).toBeInTheDocument();
        });

        test("displays 'Cannot connect to chat server.' when disconnect occurs after a successful connect", async () => {
            apiClient.get.mockResolvedValueOnce({
                data: { id: "1", email: "someGuy@email.com", firstName: "Some", lastName: "Guy" },
            });

            render(<Chat />);

            await waitFor(() => {
                expect(socket.on).toHaveBeenCalledWith("connect", expect.any(Function));
                expect(socket.on).toHaveBeenCalledWith("disconnect", expect.any(Function));
            });

            const connectHandler = socket.on.mock.calls.find(
                ([eventName]) => eventName === "connect"
            )[1];

            const disconnectHandler = socket.on.mock.calls.find(
                ([eventName]) => eventName === "disconnect"
            )[1];

            await act(async () => {
                connectHandler();
            });

            await act(async () => {
                disconnectHandler();
            });

            expect(screen.getByText("Cannot connect to chat server.")).toBeInTheDocument();
        });
    }); 
});