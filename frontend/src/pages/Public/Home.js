import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VerificationReminder from '../../components/common/verificationReminder';
import Breadcrumb from '../../components/common/Breadcrumb';
import api from "../../utils/api";
import { PlusCircle, Home as HomeIcon, BarChart2, Newspaper, CreditCard, MessageCircle, HelpCircle, Building2, Users, Settings, User } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function Home() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsEmailVerified(!!parsedUser.IsVerified);
        }
        const response = await api.get("/user/profile");
        if (response.data) {
          setUser(response.data);
          setIsEmailVerified(!!response.data.IsVerified);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (err) {
        setError('Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleVerificationSuccess = () => {
    setUser(prev => ({
      ...prev,
      IsVerified: true
    }));
    setIsEmailVerified(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.AdminRight === 1;

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 sm:px-8 pt-4">
        <div className="max-w-7xl mx-auto pt-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#2D6B9F]">
              {isAdmin ? 'Админ удирдлага' : 'Хэрэглэгчийн хэсэг'}
            </h1>
            <div className="px-4 pt-2 sm:px-0">
              <Breadcrumb />
            </div>
            <p className="text-gray-600 mt-2">
              {isAdmin
                ? 'Системийн удирдлагын үйлдлүүд'
                : 'Хэрэглэгчийн үндсэн үйлдлүүд'}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-0 sm:px-0 lg:px-0">
          {user && !isEmailVerified && (
            <VerificationReminder user={user} onVerify={handleVerificationSuccess} />
          )}

          {!isAdmin && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
              <div
                className="p-6 rounded-md cursor-pointer hover:bg-blue-50 flex flex-col items-center"
                onClick={() => navigate('/profile/apartment')}
              >
                <Building2 size={32} className="mb-2 text-[#2D6B9F]" />
                <h4 className="font-medium text-gray-700 text-lg">Орон сууц</h4>
                <p className="text-sm text-gray-500 text-center">Орон сууцны мэдээлэл</p>
              </div>
              <div
                className="p-6 rounded-md cursor-pointer hover:bg-blue-50 flex flex-col items-center"
                onClick={() => navigate('/news')}
              >
                <Newspaper size={32} className="mb-2 text-[#2D6B9F]" />
                <h4 className="font-medium text-gray-700 text-lg">Мэдээ мэдээлэл</h4>
                <p className="text-sm text-gray-500 text-center">Системийн мэдээ, мэдээлэл</p>
              </div>
              <div
                className="p-6 rounded-md cursor-pointer hover:bg-blue-50 flex flex-col items-center"
                onClick={() => navigate('/user/metercounter')}
              >
                <BarChart2 size={32} className="mb-2 text-[#2D6B9F]" />
                <h4 className="font-medium text-gray-700 text-lg">Тоолуур</h4>
                <p className="text-sm text-gray-500 text-center">Тоолуурын үзүүлэлт</p>
              </div>
              <div
                className="p-6 rounded-md cursor-pointer hover:bg-blue-50 flex flex-col items-center"
                onClick={() => navigate('/user/payment-info')}
              >
                <CreditCard size={32} className="mb-2 text-[#2D6B9F]" />
                <h4 className="font-medium text-gray-700 text-lg">Төлбөр</h4>
                <p className="text-sm text-gray-500 text-center">Төлбөрийн мэдээлэл</p>
              </div>
              <div
                className="p-6 rounded-md cursor-pointer hover:bg-blue-50 flex flex-col items-center"
                onClick={() => navigate('/feedback')}
              >
                <MessageCircle size={32} className="mb-2 text-[#2D6B9F]" />
                <h4 className="font-medium text-gray-700 text-lg">Санал хүсэлт</h4>
                <p className="text-sm text-gray-500 text-center">Санал, хүсэлт илгээх</p>
              </div>
              <div
                className="p-6 rounded-md cursor-pointer hover:bg-blue-50 flex flex-col items-center"
                onClick={() => navigate('/service')}
              >
                <HelpCircle size={32} className="mb-2 text-[#2D6B9F]" />
                <h4 className="font-medium text-gray-700 text-lg">Үйлчилгээ</h4>
                <p className="text-sm text-gray-500 text-center">Үйлчилгээний мэдээлэл</p>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
              <div
                className="p-6 rounded-md cursor-pointer hover:bg-blue-50 flex flex-col items-center"
                onClick={() => navigate('/admin/user')}
              >
                <Users size={32} className="mb-2 text-[#2D6B9F]" />
                <h4 className="font-medium text-gray-700 text-lg">Хэрэглэгчид</h4>
                <p className="text-sm text-gray-500 text-center">Системийн хэрэглэгчдийг удирдах</p>
              </div>
              <div
                className="p-6 rounded-md cursor-pointer hover:bg-blue-50 flex flex-col items-center"
                onClick={() => navigate('/admin/tarif')}
              >
                <Settings size={32} className="mb-2 text-[#2D6B9F]" />
                <h4 className="font-medium text-gray-700 text-lg">Тариф</h4>
                <p className="text-sm text-gray-500 text-center">Тариф болон тохиргоо</p>
              </div>
              <div
                className="p-6 rounded-md cursor-pointer hover:bg-blue-50 flex flex-col items-center"
                onClick={() => navigate('/admin/report')}
              >
                <BarChart2 size={32} className="mb-2 text-[#2D6B9F]" />
                <h4 className="font-medium text-gray-700 text-lg">Тайлан</h4>
                <p className="text-sm text-gray-500 text-center">Системийн тайлан, шинжилгээ</p>
              </div>
              <div
                className="p-6 rounded-md cursor-pointer hover:bg-blue-50 flex flex-col items-center"
                onClick={() => navigate('/profile')}
              >
                <User size={32} className="mb-2 text-[#2D6B9F]" />
                <h4 className="font-medium text-gray-700 text-lg">Админ профайл</h4>
                <p className="text-sm text-gray-500 text-center">Өөрийн админ мэдээлэл</p>
              </div>
              <div
                className="p-6 rounded-md cursor-pointer hover:bg-blue-50 flex flex-col items-center"
                onClick={() => navigate('/feedback')}
              >
                <MessageCircle size={32} className="mb-2 text-[#2D6B9F]" />
                <h4 className="font-medium text-gray-700 text-lg">Санал хүсэлт</h4>
                <p className="text-sm text-gray-500 text-center">Санал, хүсэлтэнд хариу өгөх</p>
              </div>
              <div
                className="p-6 rounded-md cursor-pointer hover:bg-blue-50 flex flex-col items-center"
                onClick={() => navigate('/service')}
              >
                <HelpCircle size={32} className="mb-2 text-[#2D6B9F]" />
                <h4 className="font-medium text-gray-700 text-lg">Үйлчилгээ</h4>
                <p className="text-sm text-gray-500 text-center">Үйлчилгээнд хариу өгөх</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;