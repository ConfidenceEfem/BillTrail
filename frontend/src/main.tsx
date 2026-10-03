import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>

 <QueryClientProvider client={queryClient}>
     <App />
     <ReactQueryDevtools initialIsOpen={false}/>
 </QueryClientProvider>
  </StrictMode>,
)
