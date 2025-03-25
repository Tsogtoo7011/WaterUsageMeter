import React, { useEffect } from 'react';
import $ from 'jquery';

function SampleComponent() {
  useEffect(() => {
    // Example of jQuery usage
    $('#jquery-example').on('click', function() {
      $(this).css('background-color', '#4ade80');
      $(this).text('jQuery Changed Me!');
    });
    
    // Cleanup function to remove event listeners
    return () => {
      $('#jquery-example').off('click');
    };
  }, []);

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4">
      <div className="md:flex">
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
            Full Stack App
          </div>
          <p className="mt-2 text-slate-500">
            Using React, Tailwind, Node.js, and MySQL
          </p>
          <button 
            id="jquery-example"
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Click me (jQuery example)
          </button>
        </div>
      </div>
    </div>
  );
}

export default SampleComponent;