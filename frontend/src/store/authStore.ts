import {create} from "zustand"
import {persist} from "zustand/middleware"

type AuthState = {
    accessToken: string | null,
    refreshToken: string | null,
    setTokens: (accessToken: string, refreshToken: string) => void,
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set)=>({
            accessToken: null,
            refreshToken: null,
            logout: ()=> set({refreshToken: null, accessToken: null}),
            setTokens: (accessToken, refreshToken) => set({accessToken, refreshToken})
        }), {name: "Bill-Trail Auth"}
    )
)