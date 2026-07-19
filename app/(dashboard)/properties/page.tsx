"use client";

import { useState } from "react";
import { Plus, Building2, Trash2, Edit, Layers, DoorOpen } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

interface Property {
  id: number;
  name: string;
  address: string;
  floors: number;
  units: number;
  type: string;
  date: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const newProperty: Property = {
      id: Date.now(),
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      floors: Number(formData.get("floors")),
      units: Number(formData.get("units")),
      type: formData.get("type") as string,
      date: new Date().toLocaleDateString("fa-IR"),
    };

    setProperties([...properties, newProperty]);
    setModalOpen(false);
    form.reset();
  };

  const deleteProperty = (id: number) => {
    if (confirm("آیا از حذف این ملک اطمینان دارید؟")) {
      setProperties(properties.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">مدیریت املاک</h1>
              <p className="text-sm text-gray-500">مدیریت املاک، طبقات و ساختار فیزیکی</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
            >
              <Plus size={18} />
              <span>ثبت ملک جدید</span>
            </button>
          </div>

          {properties.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="mb-6 animate-bounce">
                <Building2 size={120} className="mx-auto text-indigo-500" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">هنوز هیچ ملکی ثبت نشده است</h2>
              <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                برای شروع، اولین ملک خود را ثبت کنید و مدیریت املاک و کرایه‌ها را آسان‌تر نمایید.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
              >
                <Plus size={18} />
                <span>ثبت اولین ملک</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <Building2 size={24} />
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{p.date}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{p.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{p.address}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Layers size={14} className="text-indigo-400" />
                      {p.floors} طبقه
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DoorOpen size={14} className="text-indigo-400" />
                      {p.units} واحد
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    <button
                      onClick={() => deleteProperty(p.id)}
                      className="flex-1 text-red-600 text-sm py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 size={14} />
                      حذف
                    </button>
                    <button className="flex-1 text-indigo-600 text-sm py-2 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1">
                      <Edit size={14} />
                      ویرایش
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">ثبت ملک جدید</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نام ملک</label>
                  <input name="name" required className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="مثلاً: برج الماس" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">آدرس</label>
                  <textarea name="address" required rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none" placeholder="آدرس کامل ملک را وارد کنید..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تعداد طبقات</label>
                    <input name="floors" type="number" min={1} required className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تعداد واحد</label>
                    <input name="units" type="number" min={1} required className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="20" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع ملک</label>
                  <select name="type" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white">
                    <option>آپارتمان مسکونی</option>
                    <option>مجتمع تجاری</option>
                    <option>ساختمان اداری</option>
                    <option>هتل</option>
                    <option>انبار</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                    انصراف
                  </button>
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30">
                    ثبت ملک
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}