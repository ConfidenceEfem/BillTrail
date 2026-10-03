import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { LoginPage } from "../pages/LoginPage"
import { RegisterPage } from "../pages/RegisterPage"
import { RequireAuth } from "../components/RequireAuth"
import { InvoicesPage } from "../pages/InvoicesPage"
import { DashboardPage } from "../pages/DashboardPage"
import { ClientsPage } from "../pages/ClientsPage"
import { AppShell } from "../components/AppShell"
import { VerifyEmailPage } from "../pages/VerfiyEmailPage"
import { ForgotPasswordPage } from "../pages/ForgetPasswordPage"
import { ResetPasswordPage } from "../pages/ResetPasswordPage"

export const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<LoginPage/>} path="/login"/>
            <Route element={<RegisterPage/>} path="/register"/>

            <Route path="/verify-email" element={<VerifyEmailPage />} />
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<RequireAuth/>}>
               <Route element={<AppShell/>}>
                 <Route element={<InvoicesPage/>} path="/invoices"/>
                <Route element={<DashboardPage/>} path="/dashboard"/>
                <Route element={<ClientsPage/>} path="/clients"/>


                <Route element={<Navigate to="/dashboard" replace/>} path="*"/>
               </Route>
            </Route>
        </Routes>
    )
}