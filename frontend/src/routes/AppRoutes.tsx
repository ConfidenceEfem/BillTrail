import {  Navigate, Route, Routes } from "react-router-dom"
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
import { InvoiceDetailPage } from "../pages/InvoiceDetailPage"

import { PublicInvoicePage } from "../pages/PublicInvoicePage";
import { PaymentCompletePage } from "../pages/PaymentCompletePage";
import { SettingsPage } from "../pages/SettingsPage"
import { NotFoundPage } from "../pages/NotFoundPage"
import { LandingPage } from "../pages/LandingPage"




export const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<LandingPage/>} path="/"/>
            <Route element={<LoginPage/>} path="/login"/>
            <Route element={<RegisterPage/>} path="/register"/>

            <Route path="/verify-email" element={<VerifyEmailPage />} />
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
<Route path="/pay/:token" element={<PublicInvoicePage />} />
<Route path="/pay/:token/complete" element={<PaymentCompletePage />} />

            <Route element={<RequireAuth/>}>
               <Route element={<AppShell/>}>
                 <Route element={<InvoicesPage/>} path="/invoices"/>
                <Route element={<DashboardPage/>} path="/dashboard"/>
                <Route element={<ClientsPage/>} path="/clients"/>
                <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                <Route path="*" element={<NotFoundPage />} />
               </Route>
            </Route>

        </Routes>
    )
}