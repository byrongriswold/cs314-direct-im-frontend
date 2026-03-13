import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Chat from "@/pages/chat/Chat";
import apiClient from "@/lib/apiClient";
import socket from "@/lib/socket";

const mockNavigate = jest.fn();

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
        emit: jest.fn(),
    },
}));

describe("Exchanging Messages - Feature Tests", () => {
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

    test("user sends a message after entering an existing chat room", async () => {
        apiClient.get
            .mockResolvedValueOnce({
                data: { id: "1", email: "someGuy@email.com", firstName: "Some", lastName: "Guy" },
            }) // current user info
            .mockResolvedValueOnce({
                data: {
                    contacts: [
                        {
                            _id: "2",
                            firstName: "User",
                            lastName: "Two",
                            email: "userTwo@email.com",
                            lastMessageTime: "2025-03-01T12:00:00.000Z",
                        },
                    ],
                },
            }); // sent message

        apiClient.post.mockResolvedValueOnce({ data: { messages: [] } }); // initial messages after entering chatroom

        render(<Chat />);

        await userEvent.click(await screen.findByText("User Two"));

        const messageInput = await screen.findByPlaceholderText(/type a message/i);
        const sendButton = screen.getByRole("button", { name: /send/i });

        await userEvent.type(messageInput, "Test");
        await userEvent.click(sendButton);

        expect(socket.emit).toHaveBeenCalledWith(
            "sendMessage",
            expect.objectContaining({
                content: "Test",
            })
        );
        expect(screen.getByText("User Two")).toBeInTheDocument(); 
    });

    test("user receives a message while viewing an existing chat room", async () => {
        apiClient.get
            .mockResolvedValueOnce({
                data: { id: "1", email: "someGuy@email.com", firstName: "Some", lastName: "Guy" },
            }) // current user info
            .mockResolvedValueOnce({
                data: {
                    contacts: [
                        {
                            _id: "2",
                            firstName: "User",
                            lastName: "Two",
                            email: "userTwo@email.com",
                            lastMessageTime: "2025-03-01T12:00:00.000Z",
                        },
                    ],
                },
            }); // received message

        apiClient.post.mockResolvedValueOnce({ data: { messages: [] } });

        render(<Chat />);

        await userEvent.click(await screen.findByText("User Two"));
        expect(await screen.findByText("No messages")).toBeInTheDocument();

        const receiveHandler = socket.on.mock.calls.find(
            ([eventName]) => eventName === "receiveMessage"
        )[1];

        await act(async () => {
            receiveHandler({
                _id: "m1",
                sender: { _id: "2" },
                recipient: { _id: "1" },
                content: "Test",
                timestamp: "2025-03-01T12:05:00.000Z",
            });
        });

        expect(await screen.findByText("Test")).toBeInTheDocument();
    });
});

describe("Viewing Conversation History - Feature Tests", () => {
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

    test("opening a chat room displays previously exchanged messages", async () => {
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
                data: {
                    contacts: [
                        {
                            _id: "2",
                            firstName: "User",
                            lastName: "Two",
                            email: "userTwo@email.com",
                        },
                    ],
                },
            }); // contact in chat list 

        apiClient.post.mockResolvedValueOnce({
            data: {
                messages: [
                    {
                        _id: "m1",
                        sender: "1",
                        recipient: "2",
                        content: "Test 1",
                        timestamp: "2025-03-01T12:00:00.000Z",
                    },
                    {
                        _id: "m2",
                        sender: "2",
                        recipient: "1",
                        content: "Test 2",
                        timestamp: "2025-03-01T12:01:00.000Z",
                    },
                ],
            },
        }); // exchanged messages

        render(<Chat />);

        await userEvent.click(await screen.findByText("User Two"));

        expect(await screen.findByText("Test 1")).toBeInTheDocument();
        expect(screen.getByText("Test 2")).toBeInTheDocument();
    });

    test("conversation history corresponds to each indiviudal chat room and changes when switching rooms", async () => {
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
                data: {
                    contacts: [
                        {
                            _id: "2",
                            firstName: "User",
                            lastName: "Two",
                            email: "userTwo@email.com",
                        },
                        {
                            _id: "3",
                            firstName: "John",
                            lastName: "Doe",
                            email: "johnDoe@email.com",
                        },
                    ],
                },
            }) // contacts in chat list
            .mockResolvedValueOnce({
                data: {
                    contacts: [
                        {
                            _id: "2",
                            firstName: "User",
                            lastName: "Two",
                            email: "userTwo@email.com",
                        },
                        {
                            _id: "3",
                            firstName: "John",
                            lastName: "Doe",
                            email: "janeDoe@email.com",
                        },
                    ],
                },
            }); // exchanged messagaes with first contact

        apiClient.post
            .mockResolvedValueOnce({
                data: {
                    messages: [
                        {
                            _id: "m1",
                            sender: "2",
                            recipient: "1",
                            content: "Test - User Two",
                            timestamp: "2025-03-01T12:00:00.000Z",
                        },
                    ],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    messages: [
                        {
                            _id: "m2",
                            sender: "3",
                            recipient: "1",
                            content: "Test - John Doe",
                            timestamp: "2025-03-01T12:01:00.000Z",
                        },
                    ],
                },
            }); // exchanged messages with second contact

        render(<Chat />);

        await userEvent.click(await screen.findByText("User Two"));
        expect(await screen.findByText("Test - User Two")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /back/i }));
        expect(await screen.findByText("Chats")).toBeInTheDocument();

        await userEvent.click(await screen.findByText("John Doe"));
        expect(await screen.findByText("Test - John Doe")).toBeInTheDocument();
    });
});
