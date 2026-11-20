// import "./globals.css";
// import Navbar from "./components/Navbar";
// import Footer from "./components/Footer";
// import PageTransitionWrapper from "./components/PageTransitionWrapper";

// export const metadata = {
//   title: "My Portfolio",
//   description: "Built with Next.js and Tailwind CSS",
// };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body className="bg-gray-100 min-h-screen flex flex-col">
//         <Navbar />
//         <PageTransitionWrapper>
//           <div className="flex-grow">{children}</div>
//         </PageTransitionWrapper>
//         <Footer />{" "}
//       </body>
//     </html>
//   );
// }

// 2nd option with dark mode toggle

// import "./globals.css";
// import Navbar from "./components/Navbar";
// import Footer from "./components/Footer";

// export const metadata = {
//   title: "My Portfolio",
//   description: "Shared layout",
// };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body className="flex flex-col min-h-screen">
//         <Navbar />
//         <div className="flex-grow">{children}</div>
//         <Footer />
//       </body>
//     </html>
//   );
// }

//3rd option with dark mode toggle

import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { PortfolioProvider } from "./components/PortfolioProvider";

export const metadata = {
  title: "Alexis Nazareno | Portfolio",
  description: "Personal portfolio of Alexis Nazareno.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-[#f7faf9] text-[#122126] dark:bg-[#09171d] dark:text-[#eef5f3]">
        <PortfolioProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </PortfolioProvider>
      </body>
    </html>
  );
}
