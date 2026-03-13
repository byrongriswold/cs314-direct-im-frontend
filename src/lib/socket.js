import { io } from "socket.io-client";
import { HOST } from "@/lib/constants";

const socket = io(HOST, {
    autoConnect: false,
    transports: ["websocket"],
    withCredentials: true,
    extraHeaders: {
        "ngrok-skip-browser-warning": "true",
    },
});

export default socket;