import React, { useState } from 'react';

export function Feedback() {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    phone: '',
    email: '',
    feedbackType: 'feedback',
    message: ''
  });

  const [errors, setErrors] = useState({
    lastName: false,
    firstName: false,
    phone: false,
    email: false,
    message: false
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      lastName: !formData.lastName.trim(),
      firstName: !formData.firstName.trim(),
      phone: !formData.phone.trim() || !/^\d{8}$/.test(formData.phone),
      email: !formData.email.trim() || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email),
      message: !formData.message.trim()
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      console.log('Form submitted:', formData);
      setIsSubmitted(true);
      
      setTimeout(() => {
        setFormData({
          lastName: '',
          firstName: '',
          phone: '',
          email: '',
          feedbackType: 'feedback',
          message: ''
        });
        setIsSubmitted(false);
      }, 3000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Санал хүсэлт, гомдол, өргөдөл</h1>
        
        {isSubmitted ? (
          <div className="p-4 mb-6 bg-green-500 bg-opacity-20 text-green-100 rounded-lg">
            Таны санал хүсэлт амжилттай илгээгдлээ. Баярлалаа!
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-800 font-medium mb-2" htmlFor="lastName">
                  Овог <span className="text-red-400">*</span>
                </label>
                <input
                  className={`w-full px-4 py-2 bg-gray-100 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Овог"
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-400">Овог заавал шаардлагатай</p>}
              </div>
              
              <div>
                <label className="block text-gray-800 font-medium mb-2" htmlFor="firstName">
                  Нэр <span className="text-red-400">*</span>
                </label>
                <input
                  className={`w-full px-4 py-2 bg-gray-100 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Нэр"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-400">Нэр заавал шаардлагатай</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-800 font-medium mb-2" htmlFor="phone">
                  Утасны дугаар <span className="text-red-400">*</span>
                </label>
                <input
                  className={`w-full px-4 py-2 bg-gray-100 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="88888888"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-400">
                    {!formData.phone.trim() ? 'Утасны дугаар заавал шаардлагатай' : '8 оронтой тоо оруулна уу'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-800 font-medium mb-2" htmlFor="email">
                  Email хаяг <span className="text-red-400">*</span>
                </label>
                <input
                  className={`w-full px-4 py-2 bg-gray-100 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">
                    {!formData.email.trim() ? 'Email хаяг заавал шаардлагатай' : 'Зөв email хаяг оруулна уу'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-800 font-medium mb-2">
                Хэлбэр <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200">
                  <input
                    type="radio"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                    name="feedbackType"
                    value="feedback"
                    checked={formData.feedbackType === 'feedback'}
                    onChange={handleChange}
                  />
                  <span className="ml-3 text-gray-800">Санал хүсэлт</span>
                </label>
                
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200">
                  <input
                    type="radio"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                    name="feedbackType"
                    value="complaint"
                    checked={formData.feedbackType === 'complaint'}
                    onChange={handleChange}
                  />
                  <span className="ml-3 text-gray-800">Гомдол</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-gray-800 font-medium mb-2" htmlFor="message">
                Дэлгэрэнгүй <span className="text-red-400">*</span>
              </label>
              <textarea
                className={`w-full px-4 py-3 bg-gray-100 border ${errors.message ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                id="message"
                name="message"
                rows="6"
                placeholder="Таны санал хүсэлт, гомдол, өргөдлийг дэлгэрэнгүй бичнэ үү..."
                value={formData.message}
                onChange={handleChange}
              ></textarea>
              {errors.message && <p className="mt-1 text-sm text-red-400">Дэлгэрэнгүй мэдээлэл заавал шаардлагатай</p>}
            </div>

            <div className="flex justify-end">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
                type="submit"
              >
                Илгээх
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Feedback;
