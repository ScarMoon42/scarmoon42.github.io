import { useState } from "react";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import logo from "@/assets/09c60c1eaaa2858b3c0abd9c8569a99f8e9b81a8.png";

interface TeacherNavigationProps {
  showLogout?: boolean;
  onLogout?: () => void;
}

export function TeacherNavigation({ showLogout = false, onLogout }: TeacherNavigationProps) {
  const [logoError, setLogoError] = useState(false);
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            {logoError ? (
              <span className="text-lg font-semibold text-gray-700">СибГИУ</span>
            ) : (
              <img src={logo} alt="СибГИУ" className="h-10" onError={() => setLogoError(true)} />
            )}
          </div>
          {showLogout && onLogout && (
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
