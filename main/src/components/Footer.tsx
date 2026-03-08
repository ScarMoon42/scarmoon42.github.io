import logo from "@/assets/09c60c1eaaa2858b3c0abd9c8569a99f8e9b81a8.png";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <img
              src={logo}
              alt="СибГИУ"
              className="h-12 mb-4"
            />
            <p className="text-sm text-gray-400 max-w-md">
              Информационная система управления кадровой
              политикой Сибирского государственного
              индустриального университета. Первый вуз Кузбасса.
            </p>
          </div>
          <div>
            <h3 className="text-white mb-4">Поддержка</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors"
                >
                  Документация
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors"
                >
                  Техническая поддержка
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors"
                >
                  Контакты
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
          <p>&copy; 2025 СибГИУ. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}