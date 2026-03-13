import axios from "axios"
import { HOST } from "@/lib/constants";

const apiClient = axios.create({
    baseURL: HOST,
    withCredentials: true,
    headers: {
        "ngrok-skip-browser-warning": "true",
    },
})

export default apiClient;