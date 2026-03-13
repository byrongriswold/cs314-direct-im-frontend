import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ChatList from "@/pages/chat/ChatList";
import apiClient from "@/lib/apiClient";
import { CONTACT_ROUTES } from "@/lib/constants";

describe("Chat List Component - Unit Tests", () => {
    let originalLog;
    let onOpenNewChatMock;
    let onOpenOldChatMock;
    let onOpenProfileMock;

    beforeAll(() => {
        originalLog = console.log;
        console.log = jest.fn();
    });

    afterAll(() => {
        console.log = originalLog;
    });

    beforeEach(async () => {
        jest.clearAllMocks();

        onOpenNewChatMock = jest.fn();
        onOpenOldChatMock = jest.fn();
        onOpenProfileMock = jest.fn();
    });

    describe("Rendering and Callback Unit Tests", () => {
        test('displays contacts fetched from API', async () => {
            apiClient.get.mockResolvedValue({
                data: {
                    contacts: [
                    { _id: "1", firstName: "First", lastName: "Last", email: "firstlast@email.com"},
                    { _id: "2", email: "givenfamily@email.com"}
                    ],
                },
            });

            render(
                <ChatList
                    onOpenNewChat={onOpenNewChatMock}
                    onOpenOldChat={onOpenOldChatMock}
                    onOpenProfile={onOpenProfileMock}
                />
            );

            await waitFor(() => {
                expect(screen.getByText("First Last")).toBeInTheDocument();
                expect(screen.getByText("givenfamily@email.com")).toBeInTheDocument();
            });
        });

        test('displays "No chats" when API returns empty contacts array', async() => {
            apiClient.get.mockResolvedValue({
                data: {
                    contacts: []
                },
            });

            render(
                <ChatList
                    onOpenNewChat={onOpenNewChatMock}
                    onOpenOldChat={onOpenOldChatMock}
                    onOpenProfile={onOpenProfileMock}
                />
            );

            await waitFor(() => {
                expect(screen.getByText("No chats")).toBeInTheDocument();
            });
        });
        
        test('Calls onOpenNewChat when + New Chat button is clicked', async () => {
            apiClient.get.mockResolvedValueOnce({ 
                data: { 
                    contacts: [] 
                } 
            });

            render(
                <ChatList
                    onOpenNewChat={onOpenNewChatMock}
                    onOpenOldChat={onOpenOldChatMock}
                    onOpenProfile={onOpenProfileMock}
                />
            );

            await waitFor(() => screen.getByText("No chats"));

            const newChatButton = screen.getByRole("button", { name: "+ New Chat" });
            await userEvent.click(newChatButton);

            expect(onOpenNewChatMock).toHaveBeenCalled();
        });

        test('Calls onOpenOldChat with the correct contact when a contact is clicked', async () => {
            apiClient.get.mockResolvedValue({
                data: {
                    contacts: [
                    { _id: "1", firstName: "First", lastName: "Last", email: "firstlast@email.com"},
                    { _id: "2", email: "givenfamily@email.com"}
                    ],
                },
            });

            render(
                <ChatList
                    onOpenNewChat={onOpenNewChatMock}
                    onOpenOldChat={onOpenOldChatMock}
                    onOpenProfile={onOpenProfileMock}
                />
            );

            const contactDiv = await screen.findByText('First Last');

            await userEvent.click(contactDiv);

            expect(onOpenOldChatMock).toHaveBeenCalledWith({
                id: "1",
                firstName: "First",
                lastName: "Last",
                email: "firstlast@email.com"
            });
        });

        test('Calls onOpenProfile when the Profile button is clicked', async () => {
            apiClient.get.mockResolvedValueOnce({ 
                data: { 
                    contacts: [] 
                } 
            });

            render(
                <ChatList
                    onOpenNewChat={onOpenNewChatMock}
                    onOpenOldChat={onOpenOldChatMock}
                    onOpenProfile={onOpenProfileMock}
                />
            );

            await waitFor(() => screen.getByText("No chats"));
            
            const profileButton = screen.getByRole("button", { name: /profile/i });

            await userEvent.click(profileButton);

            expect(onOpenProfileMock).toHaveBeenCalled();
        });
    });
    
    describe("Delete Chat Room Unit Tests", () => {
        test(`removes a contact from the chat list when the delete 
            button is clicked and the user confirms`, async () => {
            apiClient.get.mockResolvedValueOnce({
                data: {
                    contacts: [
                    { _id: "1", firstName: "Some", lastName: "Guy", email: "someGuy@email.com"},
                    { _id: "2", firstName: "User", lastName: "Two", email: "someGuy@email.com"},
                    ],
                },
            });

            apiClient.delete.mockResolvedValueOnce({});

            jest.spyOn(window, "confirm").mockImplementation(() => true);

            render(
                <ChatList
                    onOpenNewChat={onOpenNewChatMock}
                    onOpenOldChat={onOpenOldChatMock}
                    onOpenProfile={onOpenProfileMock}
                />
            );

            const contact1 = await screen.findByText("Some Guy");
            const contact2 = await screen.findByText("User Two");

            expect(contact1).toBeInTheDocument();
            expect(contact2).toBeInTheDocument();

            const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
            const contactOneDeleteButton = deleteButtons[0];

            await userEvent.click(contactOneDeleteButton);
            expect(apiClient.delete).toHaveBeenCalledWith(`${CONTACT_ROUTES.DELETE}1`);

            await waitFor(() => {
                expect(screen.queryByText("Some Guy")).not.toBeInTheDocument();
            });

            expect(screen.getByText("User Two")).toBeInTheDocument();

            window.confirm.mockRestore();
        });

        test(`Does not remove a contact from the chat list when the delete 
            button is clicked and the user presses cancel`, async () => {
            apiClient.get.mockResolvedValueOnce({
                data: {
                    contacts: [
                    { _id: "1", firstName: "Some", lastName: "Guy", email: "someGuy@email.com"},
                    ],
                },
            });

            apiClient.delete.mockResolvedValueOnce({});

            jest.spyOn(window, "confirm").mockImplementation(() => false);

            render(
                <ChatList
                    onOpenNewChat={onOpenNewChatMock}
                    onOpenOldChat={onOpenOldChatMock}
                    onOpenProfile={onOpenProfileMock}
                />
            );

            const contact = await screen.findByText("Some Guy");
            expect(contact).toBeInTheDocument();

            const deleteButton = screen.getByRole("button", { name: /delete/i });
            await userEvent.click(deleteButton);

            expect(apiClient.delete).not.toHaveBeenCalled();
            expect(screen.getByText("Some Guy")).toBeInTheDocument();

            window.confirm.mockRestore();
        }); 
    });

    describe("API Error Handling Unit Tests", () => {
        test('handles API failure when fetching contacts for the list', async () => {
            apiClient.get.mockRejectedValueOnce({ response: { status: 500 } });

            render(
                <ChatList
                    onOpenNewChat={onOpenNewChatMock}
                    onOpenOldChat={onOpenOldChatMock}
                    onOpenProfile={onOpenProfileMock}
                />
            );

            await waitFor(() => {
                expect(apiClient.get).toHaveBeenCalledWith(CONTACT_ROUTES.LIST);
            });

            expect(screen.getByText("Chats")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /\+ new chat/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /profile/i })).toBeInTheDocument();
            expect(console.log).toHaveBeenCalledWith({ response: { status: 500 } });
        });
    });
});