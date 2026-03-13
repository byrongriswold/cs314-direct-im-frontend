import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import socket from "@/lib/socket";
import ChatRoom from "@/pages/chat/ChatRoom";
import apiClient from "@/lib/apiClient";
import { GET_MESSAGE_ROUTE } from "@/lib/constants";

jest.mock("@/lib/socket", () => ({
    __esModule: true,
    default: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
    },
}));

describe("Chat Room Component - Unit Tests", () => {
    let originalLog;
    let onGoBackMock;
    let contact;
    let currentUser;

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

    beforeEach(async () => {
        jest.clearAllMocks();

        onGoBackMock = jest.fn();
        currentUser = { id: "1", name: "Some Guy", email: "someGuy@email.com" };
        contact = { id: "2", name: "User Two", email: "userTwo@email.com" };
    });

    describe("Header Rendering Unit Tests", () => {
        test("displays contact name in header when contact's profile name is set", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: { messages: [] },
            });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            expect(await screen.findByText("User Two")).toBeInTheDocument();
        });

        test("displays email in header when contact's profile name is not set", async () => {
            const contact2 = {
                    id: "3",
                    name: "",
                    email: "johnDoe@email.com"
                };

            apiClient.post.mockResolvedValueOnce({
                data: { messages: [] },
            });

            render(
                <ChatRoom
                    contact={contact2}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            expect(await screen.findByText("johnDoe@email.com")).toBeInTheDocument();
        });

        test("displays first and last name in header when contact.name is missing but profile names are set", async () => {
            const contact2 = {
                id: "3",
                name: "",
                firstName: "New",
                lastName: "Person",
                email: "newPerson@email.com",
            };

            apiClient.post.mockResolvedValueOnce({
                data: { messages: [] },
            });

            render(
                <ChatRoom
                    contact={contact2}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            expect(await screen.findByText("New Person")).toBeInTheDocument();
        });
    });

    describe("Message Fetching and Rendering Unit Tests", () => {
        test("calls get-messages API endpoint with the contacts id on mount", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: { messages: [] },
            });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            await waitFor(() => {
                expect(apiClient.post).toHaveBeenCalledWith(GET_MESSAGE_ROUTE, {
                    id: "2",
                });
            });
        });

        test("renders messages and displays their content", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: {
                    messages: [
                        {
                            _id: "m1",
                            sender: "2",
                            recipient: "1",
                            content: "Test",
                            timestamp: "2025-03-01T12:00:00.000Z",
                        },
                    ],
                },
            });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            expect(await screen.findByText("Test")).toBeInTheDocument();
        });

        test("displays 'No messages' when message array is empty", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: { messages: [] },
            });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            expect(await screen.findByText("No messages")).toBeInTheDocument();
        });

        test("displays formatted timestamp for messages", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: {
                    messages: [
                        {
                            _id: "m1",
                            sender: "2",
                            recipient: "1",
                            content: "Hello there",
                            timestamp: "2025-03-01T12:00:00.000Z",
                        },
                    ],
                },
            });

            const expectedTimestamp = new Date("2025-03-01T12:00:00.000Z").toLocaleString([], {
                hour: "2-digit",
                minute: "2-digit",
                month: "short",
                day: "numeric",
            });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            expect(await screen.findByText("Hello there")).toBeInTheDocument();
            expect(screen.getByText(expectedTimestamp)).toBeInTheDocument();
        });

        test("aligns current user messages to the right and contact messages to the left", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: {
                    messages: [
                        {
                            _id: "m1",
                            sender: "1",
                            recipient: "2",
                            content: "Current user message",
                            timestamp: "2025-03-01T12:00:00.000Z",
                        },
                        {
                            _id: "m2",
                            sender: "2",
                            recipient: "1",
                            content: "Contact message",
                            timestamp: "2025-03-01T12:01:00.000Z",
                        },
                    ],
                },
            });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            const currentUserMessage = await screen.findByText("Current user message");
            const contactMessage = await screen.findByText("Contact message");

            const currentUserRow = currentUserMessage.closest('div[style*="margin-bottom: 18px"]');
            const contactRow = contactMessage.closest('div[style*="margin-bottom: 18px"]');

            expect(currentUserRow).toHaveStyle({ alignItems: "flex-end" });
            expect(contactRow).toHaveStyle({ alignItems: "flex-start" });
        });
    });

    describe("Input and Socket sendMessage Unit Tests", () => {
        test("updates message input when user types", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: { messages: [] },
            });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            const messageInput = await screen.findByPlaceholderText(/type a message/i);
            await userEvent.type(messageInput, "Test");

            expect(messageInput).toHaveValue("Test");
        });

        test(`does not emit socket message when send button is clicked and 
            input is empty or only whitespace`, async () => {
            apiClient.post.mockResolvedValueOnce({
                data: { messages: [] },
            });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            const messageInput = await screen.findByPlaceholderText(/type a message/i);
            const sendButton = screen.getByRole("button", { name: /send/i });

            await userEvent.type(messageInput, " ");
            await userEvent.click(sendButton);

            expect(socket.emit).not.toHaveBeenCalled();
        });

        test(`emits sendMessage with correct payload and clears input when 
            send button is clicked and input is not empty`, async () => {
            apiClient.post.mockResolvedValueOnce({
                data: { messages: [] },
            });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            const messageInput = await screen.findByPlaceholderText(/type a message/i);
            const sendButton = screen.getByRole("button", { name: /send/i });

            await userEvent.type(messageInput, "Test");
            await userEvent.click(sendButton);

            expect(socket.emit).toHaveBeenCalledWith("sendMessage", {
                sender: currentUser.id,
                recipient: contact.id,
                content: "Test",
                messageType: "text",
            });

            expect(messageInput).toHaveValue("");
        });

        test(`displays 'Message is too long. Maximum 500 characters.' and does not 
            send message when it is longer than max length`, async () => {
            apiClient.post.mockResolvedValueOnce({
                data: { messages: [] },
            });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            const messageInput = await screen.findByPlaceholderText(/type a message/i);
            const sendButton = screen.getByRole("button", { name: /send/i });

            const overMaxMessage = "a".repeat(501);

            await userEvent.type(messageInput, overMaxMessage);
            await userEvent.click(sendButton);

            expect(screen.getByText("Message is too long. Maximum 500 characters.")).toBeInTheDocument();
            expect(socket.emit).not.toHaveBeenCalled();
        });

        test("sends message successfully when length is exactly max message limit", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: { messages: [] },
            });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            const messageInput = await screen.findByPlaceholderText(/type a message/i);
            const sendButton = screen.getByRole("button", { name: /send/i });

            const maxLengthMessage = "a".repeat(500);

            await userEvent.type(messageInput, maxLengthMessage);
            await userEvent.click(sendButton);

            expect(socket.emit).toHaveBeenCalledWith("sendMessage", {
                sender: currentUser.id,
                recipient: contact.id,
                content: maxLengthMessage,
                messageType: "text",
            });

            expect(screen.queryByText("Message is too long. Maximum 500 characters.")).not.toBeInTheDocument();
            expect(messageInput).toHaveValue("");
        });
    });

    describe("Socket receiveMessage Unit Tests", () => {
        test("appends received socket message when it is sent from the current user or the other contact", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: { messages: [] },
            });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            expect(await screen.findByText("No messages")).toBeInTheDocument();

            const receiveCall = socket.on.mock.calls.find(
                ([eventName]) => eventName === "receiveMessage"
            );
            const receiveHandler = receiveCall[1];

            await act(async () => {
                receiveHandler({
                    _id: "m1",
                    sender: { _id: contact.id },
                    recipient: { _id: currentUser.id },
                    content: "Test",
                    timestamp: "2025-03-01T10:02:00.000Z",
                });
            });

            expect(await screen.findByText("Test")).toBeInTheDocument();
        });

        test("ignores received socket message when it was not sent by the current user or the other contact", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: { messages: [] },
            });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            expect(await screen.findByText("No messages")).toBeInTheDocument();

            const receiveCall = socket.on.mock.calls.find(
                ([eventName]) => eventName === "receiveMessage"
            );
            const receiveHandler = receiveCall[1];

            await act(async () => {
                receiveHandler({
                    _id: "m2",
                    sender: { _id: "9" },
                    recipient: { _id: "10" },
                    content: "Test",
                    timestamp: "2025-03-01T10:03:00.000Z",
                });
            });

            expect(screen.queryByText("Test")).not.toBeInTheDocument();
            expect(screen.getByText("No messages")).toBeInTheDocument();
        });
    })
    
    describe("Navigation Callback Unit Tests", () => {
        test("calls onGoBack when back button is clicked", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: { messages: [] },
            });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            const backButton = await screen.findByRole("button", { name: /back/i });
            await userEvent.click(backButton);

            expect(onGoBackMock).toHaveBeenCalled();
        });
    });

    describe("Error Handling Unit Tests", () => {
        test("UI remains stable when initial get messages API call fails", async () => {
            apiClient.post.mockRejectedValueOnce({ response: { status: 500 } });

            render(
                <ChatRoom
                    contact={contact}
                    currentUser={currentUser}
                    onGoBack={onGoBackMock}
                />
            );

            expect(await screen.findByText("User Two")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
            expect(console.log).toHaveBeenCalledWith({ response: { status: 500 } });
        });
    });
});
