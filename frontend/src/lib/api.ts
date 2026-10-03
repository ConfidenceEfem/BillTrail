import axios from "axios"
import { useAuthStore } from "../store/authStore"




export const api = axios.create({
   baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use((config)=>{
    const accessToken = useAuthStore.getState().accessToken
   if(accessToken){
    config.headers.Authorization = `Bearer ${accessToken}`
   }

   return config
})

let isRefreshing = false
let pendingRequest:  Array<()=>void> = []

api.interceptors.request.use(
    (response)=>response,
    async (error) => {
        const originalRequest = error.config

        if(error.response?.status !== 401 || originalRequest._retry){
            return Promise.reject(error)
        }

        if(isRefreshing){
            return new Promise((resolve)=> {
                pendingRequest.push(()=>resolve(api(originalRequest)))
            })
        }

        originalRequest._retry = true
        isRefreshing = true

        try{
            const refreshToken = useAuthStore.getState().refreshToken
            if(!refreshToken) throw new Error("No refresh token found")
            const {data} = await axios.post(`${import.meta.env.BASE_URL}/api/v1/auth/refresh`, refreshToken)

            useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken)
            pendingRequest.forEach((resolveQueued)=> resolveQueued())
            pendingRequest = []
            return api(originalRequest)
        }catch(refreshError){
useAuthStore.getState().logout()
return Promise.reject(refreshError)
        } finally {
            isRefreshing = false
        }
    } 
)

