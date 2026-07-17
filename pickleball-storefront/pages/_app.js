// pages/_app.js
import "../src/globals.css";
import "@/components/about-pikfun/about-pikfun.css";
import { NextUIProvider } from "@nextui-org/react";
import { appWithTranslation } from "next-i18next";
import { GoogleOAuthProvider } from '@react-oauth/google'; 

import { AuthProvider } from "../components/AuthProvider";
import { UserProvider } from "../components/context/UserContext"; 
import { CartProvider } from "../components/context/CartContext"; 

import Layout from "./Layout";
import { FontSizeProvider } from "@/components/blog/FontSizeContext";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isProductPage = router.pathname.startsWith("/product/");

  return (
    <>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <UserProvider>
            <CartProvider>
              <NextUIProvider>
                <FontSizeProvider>
                <Layout>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={router.asPath}
                      initial={isProductPage ? { opacity: 0 } : { opacity: 0, y: 20 }}
                      animate={isProductPage ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      exit={isProductPage ? { opacity: 0 } : { opacity: 0, y: -20 }}
                      transition={{
                        duration: 0.6,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                    >
                      <Component {...pageProps} />
                    </motion.div>
                  </AnimatePresence>
                </Layout>
                </FontSizeProvider>
              </NextUIProvider>
            </CartProvider>
          </UserProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </>
  );
}

export default appWithTranslation(MyApp);