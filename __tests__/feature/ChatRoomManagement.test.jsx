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

describe("Chat Room Creation - Feature Tests", () => {
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

    test(`user creates a new chat room by navigating from chat list 
        to new chat and selecting a contact`, async () => {
        apiClient.get
            .mockResolvedValueOnce({
                data: {
                    id: "1",
                    email: "someGuy@email.com",
                    firstName: "Some",
                    lastName: "Guy",
                },
            }) // Chat: user info
            .mockResolvedValueOnce({
                data: { contacts: [] },
            }); // ChatList: initial list

        apiClient.post
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
            }) // New Chat Search results
            .mockResolvedValueOnce({
                data: { messages: [] },
            }); // initial messages in Chat Room

        render(<Chat />);

        expect(await screen.findByText("Chats")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /\+ new chat/i }));
        expect(await screen.findByText("New Chat")).toBeInTheDocument();

        await userEvent.type(screen.getByPlaceholderText(/search name or email/i), "u");
        await userEvent.click(await screen.findByText("User Two"));

        expect(await screen.findByText("User Two")).toBeInTheDocument(); // ChatRoom header
        expect(screen.getByText("No messages")).toBeInTheDocument();
    });

    test("user recovers from a no results search and then creates a new chat room", async () => {
        apiClient.get
            .mockResolvedValueOnce({
                data: {
                    id: "1",
                    email: "someGuy@email.com",
                    firstName: "Some",
                    lastName: "Guy",
                },
            })
            .mockResolvedValueOnce({
                data: { contacts: [] },
            });

        apiClient.post
            .mockResolvedValueOnce({
                data: { contacts: [] },
            }) // first search results
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
            }) // second search results
            .mockResolvedValueOnce({
                data: { messages: [] },
            }); 

        render(<Chat />);

        await userEvent.click(await screen.findByRole("button", { name: /\+ new chat/i }));
        expect(await screen.findByText("New Chat")).toBeInTheDocument();

        const searchInput = screen.getByPlaceholderText(/search name or email/i);

        await userEvent.type(searchInput, "z");
        expect(await screen.findByText("No results")).toBeInTheDocument();

        await userEvent.clear(searchInput);
        await userEvent.type(searchInput, "u");
        await userEvent.click(await screen.findByText("User Two"));

        expect(await screen.findByText("User Two")).toBeInTheDocument();
        expect(screen.getByText("No messages")).toBeInTheDocument();
    });

    test("user returns from new chat to chat list without creating a chat room", async () => {
        apiClient.get
            .mockResolvedValueOnce({
                data: {
                    id: "1",
                    email: "someGuy@email.com",
                    firstName: "Some",
                    lastName: "Guy",
                },
            })
            .mockResolvedValueOnce({
                data: { contacts: [] },
            });

        render(<Chat />);

        expect(await screen.findByText("Chats")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /\+ new chat/i }));
        expect(await screen.findByText("New Chat")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /back/i }));

        expect(await screen.findByText("Chats")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /\+ new chat/i })).toBeInTheDocument();
    });

    test("Creation of a new chat causes the new contact to be displayed in chat list", async () => {
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
            }) // ChatList initial load
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
            }); // ChatList after returning from new chat room

        apiClient.post
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
            }) // new chat search results
            .mockResolvedValueOnce({
                data: { messages: [] },
            }); // Chat room messages

        render(<Chat />);

        expect(await screen.findByText("Chats")).toBeInTheDocument();
        expect(screen.getByText("No chats")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /\+ new chat/i }));
        expect(await screen.findByText("New Chat")).toBeInTheDocument();

        const searchInput = screen.getByPlaceholderText(/search name or email/i);
        await userEvent.type(searchInput, "u");
        await userEvent.click(await screen.findByText("User Two"));

        expect(await screen.findByText("User Two")).toBeInTheDocument(); // Chat room header

        await userEvent.click(screen.getByRole("button", { name: /back/i }));

        expect(await screen.findByText("Chats")).toBeInTheDocument();
        expect(await screen.findByText("User Two")).toBeInTheDocument();
    });
});

describe("Chat Room Deletion - Feature Tests", () => {
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

    test("user deletes one chat room and other active ones remain in the chat list", async () => {
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
            }); // contacts in the chat list

        apiClient.delete.mockResolvedValueOnce({});
        jest.spyOn(window, "confirm").mockImplementation(() => true);

        render(<Chat />);

        expect(await screen.findByText("User Two")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();

        const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
        await userEvent.click(deleteButtons[0]);

        expect(screen.queryByText("User Two")).not.toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();

        window.confirm.mockRestore();
    });

    test("user deletes all chat rooms and empty chat list is shown", async () => {
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
                            lastMessageTime: "2025-03-01T12:00:00.000Z",
                        },
                    ],
                },
            }); // contact in chat list

        apiClient.delete.mockResolvedValueOnce({});
        jest.spyOn(window, "confirm").mockImplementation(() => true);

        render(<Chat />);

        expect(await screen.findByText("User Two")).toBeInTheDocument();

        const deleteButton = screen.getByRole("button", { name: /delete/i });
        await userEvent.click(deleteButton);

        expect(screen.queryByText("User Two")).not.toBeInTheDocument();
        expect(await screen.findByText("No chats")).toBeInTheDocument();

        window.confirm.mockRestore();
    });
});

describe("Display and Navigation of Chat Rooms - Feature Tests", () => {
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

    test("user navigates from chat list into a chat room and back to the chat list", async () => {
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
                            lastMessageTime: "2025-03-01T12:00:00.000Z",
                        },
                        {
                            _id: "3",
                            firstName: "John",
                            lastName: "Doe",
                            email: "johnDoe@email.com",
                            lastMessageTime: "2025-03-01T12:01:00.000Z",
                        },
                    ],
                },
            }) // first chat list display
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
                        {
                            _id: "3",
                            firstName: "John",
                            lastName: "Doe",
                            email: "johnDoe@email.com",
                            lastMessageTime: "2025-03-01T12:01:00.000Z",
                        },
                    ],
                },
            }); // second chat list display after returning from chat room

        apiClient.post.mockResolvedValueOnce({
            data: { messages: [] },
        });

        render(<Chat />);

        expect(await screen.findByText("Chats")).toBeInTheDocument();
        expect(await screen.findByText("User Two")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();

        await userEvent.click(await screen.findByText("User Two"));

        expect(await screen.findByText("User Two")).toBeInTheDocument(); // ChatRoom header
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /back/i }));

        expect(await screen.findByText("Chats")).toBeInTheDocument();
        expect(await screen.findByText("User Two")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    test("user navigates between different chat rooms one at a time from the chat list", async () => {
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
                            lastMessageTime: "2025-03-01T12:00:00.000Z",
                        },
                        {
                            _id: "3",
                            firstName: "Jane",
                            lastName: "Doe",
                            email: "janeDoe@email.com",
                            lastMessageTime: "2025-03-01T12:01:00.000Z",
                        },
                    ],
                },
            }) // first chat list display
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
                        {
                            _id: "3",
                            firstName: "Jane",
                            lastName: "Doe",
                            email: "janeDoe@email.com",
                            lastMessageTime: "2025-03-01T12:01:00.000Z",
                        },
                    ],
                },
            }); // second chat list display after returning from chat room

        apiClient.post
            .mockResolvedValueOnce({ data: { messages: [] } }) // messages in first chat room
            .mockResolvedValueOnce({ data: { messages: [] } }); // messages in second chat room

        render(<Chat />);

        await userEvent.click(await screen.findByText("User Two"));
        expect(await screen.findByText("User Two")).toBeInTheDocument();
        expect(screen.queryByText("Chats")).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /back/i }));
        expect(await screen.findByText("Chats")).toBeInTheDocument();

        await userEvent.click(await screen.findByText("Jane Doe"));
        expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
        expect(screen.queryByText("Chats")).not.toBeInTheDocument();
    });
});