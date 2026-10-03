import axios from "axios"

export function getErrorMessage(error: unknown) {
    if(axios.isAxiosError(error) && error.response?.data?.error?.message){
        return error.response?.data?.error?.message
    }

    return "Something went wrong, Please try again"
}