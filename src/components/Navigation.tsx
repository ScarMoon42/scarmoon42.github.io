import logo from "@/assets/09c60c1eaaa2858b3c0abd9c8569a99f8e9b81a8.png";

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <img src={logo} alt="СибГИУ" className="h-10" />
          </div>
        </div>
      </div>
    </nav>
  );
}