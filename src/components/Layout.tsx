import { type ReactNode } from "react";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div>
      <Sidebar />
      <div className="p-4 sm:ml-64">
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;