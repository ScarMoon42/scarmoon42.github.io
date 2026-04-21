import { Users } from "lucide-react";

export function Hero() {
  return (
    <section className="relative px-6 py-20 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-8">
            <Users className="h-5 w-5" />
            <span>Информационная система СибГИУ</span>
          </div>
          <h1 className="mb-6">
            Современная система управления кадровой политикой
          </h1>
          <p className="mb-8 text-gray-600 text-lg">
            Комплексное решение для аттестации преподавателей, управления документацией, 
            проведения оценки квалификации и мониторинга деятельности педагогических кадров
          </p>
        </div>
      </div>
    </section>
  );
}