import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import NewChat from "@/pages/chat/NewChat";
import apiClient from "@/lib/apiClient";
import { CONTACT_ROUTES } from "@/lib/constants";

describe("New Chat Component - Unit Tests", () => {
    let originalLog;
    let onGoBackMock;
    let onSelectChatMock;

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
        onSelectChatMock = jest.fn();
    });

    describe("Rendering Unit Tests", () => {
        test("renders default empty state before any search", async () => {
            render(
                <NewChat
                    onGoBack={onGoBackMock}
                    onSelectChat={onSelectChatMock}
                />
            );

            expect(await screen.findByText("New Chat")).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/search name or email/i)).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
            expect(screen.queryByText("No results")).not.toBeInTheDocument();
        });
    });

    describe("Go Back Callback Unit Tests", () => {
        test("calls onGoBack when the back button is clicked", async () => {
            render(
                <NewChat
                    onGoBack={onGoBackMock}
                    onSelectChat={onSelectChatMock}
                />
            );

            const backButton = await screen.findByRole("button", { name: /back/i });
            await userEvent.click(backButton);

            expect(onGoBackMock).toHaveBeenCalled();
        });
    });

    describe("Search Unit Tests", () => {
        test("calls API search endpoint with input search term", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: { contacts: [] },
            });

            render(
                <NewChat
                    onGoBack={onGoBackMock}
                    onSelectChat={onSelectChatMock}
                />
            );

            const searchInput = await screen.findByPlaceholderText(/search name or email/i);
            await userEvent.type(searchInput, "s");

            expect(apiClient.post).toHaveBeenCalledWith(CONTACT_ROUTES.SEARCH, {
                searchTerm: "s",
            });
        });

        test("displays search results when search term is input", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: {
                    contacts: [
                        {
                            _id: "1",
                            firstName: "Some",
                            lastName: "Guy",
                            email: "someGuy@email.com",
                        },
                    ],
                },
            });

            render(
                <NewChat
                    onGoBack={onGoBackMock}
                    onSelectChat={onSelectChatMock}
                />
            );

            const searchInput = await screen.findByPlaceholderText(/search name or email/i);
            await userEvent.type(searchInput, "s");

            expect(await screen.findByText("Some Guy")).toBeInTheDocument();
            expect(screen.getByText("someGuy@email.com")).toBeInTheDocument();
        });

        test("displays email in search results when first and last name are missing", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: {
                    contacts: [
                        {
                            _id: "2",
                            firstName: "",
                            lastName: "",
                            email: "userTwo@email.com",
                        },
                    ],
                },
            });

            render(
                <NewChat
                    onGoBack={onGoBackMock}
                    onSelectChat={onSelectChatMock}
                />
            );

            const searchInput = await screen.findByPlaceholderText(/search name or email/i);
            await userEvent.type(searchInput, "u");

            expect(await screen.findByText("userTwo@email.com")).toBeInTheDocument();
        });

        test(`clears displayed results when search input is cleared and 
            does not call API search endpoint with empty input`, async () => {
            apiClient.post.mockResolvedValueOnce({
                data: {
                    contacts: [
                        {
                            _id: "1",
                            firstName: "Some",
                            lastName: "Guy",
                            email: "someGuy@email.com",
                        },
                    ],
                },
            });

            render(
                <NewChat
                    onGoBack={onGoBackMock}
                    onSelectChat={onSelectChatMock}
                />
            );

            const searchInput = await screen.findByPlaceholderText(/search name or email/i);

            await userEvent.type(searchInput, "s");
            expect(await screen.findByText("Some Guy")).toBeInTheDocument();
            expect(apiClient.post).toHaveBeenCalledTimes(1);

            await userEvent.clear(searchInput);

            expect(screen.queryByText("Some Guy")).not.toBeInTheDocument();
            expect(searchInput).toHaveValue("");
            expect(apiClient.post).toHaveBeenCalledTimes(1);
        });

        test("displays 'No results' when search term is not empty, and API search endpoint returns no contacts", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: { contacts: [] },
            });

            render(
                <NewChat
                    onGoBack={onGoBackMock}
                    onSelectChat={onSelectChatMock}
                />
            );

            const searchInput = await screen.findByPlaceholderText(/search name or email/i);
            await userEvent.type(searchInput, "s");

            expect(await screen.findByText("No results")).toBeInTheDocument();
        });
    });

    describe("Select Chat Callback Unit Tests", () => {
        test("calls onSelectChat with contact object when the contact is clicked", async () => {
            apiClient.post.mockResolvedValueOnce({
                data: {
                    contacts: [
                        {
                            _id: "1",
                            firstName: "Some",
                            lastName: "Guy",
                            email: "someGuy@email.com",
                        },
                    ],
                },
            });

            render(
                <NewChat
                    onGoBack={onGoBackMock}
                    onSelectChat={onSelectChatMock}
                />
            );

            const searchInput = await screen.findByPlaceholderText(/search name or email/i);
            await userEvent.type(searchInput, "s");

            const result = await screen.findByText("Some Guy");
            await userEvent.click(result);

            expect(onSelectChatMock).toHaveBeenCalledWith({
                id: "1",
                name: "Some Guy",
                email: "someGuy@email.com",
            });
        });
    });

    describe("Error Handling Unit Tests", () => {
        test("UI remains stable when search request returns 500 for non empty search term", async () => {
            apiClient.post.mockRejectedValueOnce({ response: { status: 500 } });

            render(
                <NewChat
                    onGoBack={onGoBackMock}
                    onSelectChat={onSelectChatMock}
                />
            );

            const searchInput = await screen.findByPlaceholderText(/search name or email/i);
            await userEvent.type(searchInput, "s");

            expect(screen.getByText("New Chat")).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/search name or email/i)).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
            expect(console.log).toHaveBeenCalledWith({ response: { status: 500 } });
        });
    });
});

