import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const features = [
  {
    title: "Send invoices in minutes",
    description: "Add a client, list what you did, and send a professional invoice with your own branding.",
  },
  {
    title: "Get paid online",
    description: "Clients pay by card or bank transfer through Paystack — no back and forth over WhatsApp.",
  },
  {
    title: "Know where you stand",
    description: "See total revenue, what's outstanding, and what's overdue, the moment you log in.",
  },
];

export function LandingPage() {
  return (
   <div className="min-h-screen gradient-bg">
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* <p className="text-lg font-medium text-brand-800">BillTrail</p> */}
       
       
        <img className="w-[180px] h-[80px] object-cover" src="/logo.png"/>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-gray-600 font-medium">
            Log in
          </Link>
          <Link
            to="/register"
            className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-800"
          >
            Get started
          </Link>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-6 pt-16 pb-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-5 leading-tight "
        >
          Invoicing and payments,
          <br />
          <span className="text-brand-600">built for small businesses.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-gray-500 text-[16px] mb-8 max-w-xl mx-auto"
        >
          Create professional invoices, send them to your clients, and get paid online.
           Flexible dashboard that shows you exactly where your money is.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Link
            to="/register"
            className="inline-block bg-brand-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-brand-800"
          >
            Create your free account
          </Link>
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-gray-50 rounded-2xl p-6"
            >
              <h3 className="text-base font-medium text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-[13px] text-gray-500">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>


    </div>
  );
}