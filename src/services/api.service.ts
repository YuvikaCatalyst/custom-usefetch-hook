import axios from "axios";

const api=axios.create({
    baseURL: 'https://sample/api/',
    headers: {
        "Content-Type": "application/json",
      },
})

export default api;