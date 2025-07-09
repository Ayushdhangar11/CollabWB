import React from 'react';
import Joinroom from './joinRoom/index.jsx';
import Createroom from './createRoom/index.jsx';

function Forms({uuid ,socket,setUser}) {




  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-r from-blue-200 to-purple-200 flex flex-col items-center py-10 px-4">
      
      {/* Heading */}
      <div className="text-center m-15">
        <h1 className="text-5xl font-extrabold text-Black ">
          Collaborative Whiteboard & Chat Room
        </h1>
        <p className="text-gray-500 mt-2 text-2xl">
          Real-time drawing and messaging for seamless teamwork
        </p>
      </div>

      {/* Form Blocks */}
      <div className="m-5 flex flex-col lg:flex-row justify-center items-center gap-10 w-full max-w-6xl">
        
        {/* Create Room */}
        <div className="flex flex-col justify-center items-center w-full lg:w-[50%] rounded-2xl bg-blue-100 p-6 hover:border-2 border-indigo-400 hover:shadow-2xl shadow-indigo-500">
          <h2 className="text-black-600 mb-5 text-center font-extrabold text-4xl">Create Room</h2>
          <Createroom uuid={uuid} socket={socket} setUser={setUser}/>
        </div>

        {/* Join Room */}
        <div className="flex flex-col justify-center items-center w-full lg:w-[50%] rounded-2xl bg-blue-100 p-6 hover:border-2 border-indigo-400 hover:shadow-2xl shadow-indigo-500">
          <h2 className="text-black-600 mb-5 text-center font-extrabold text-4xl">Join Room</h2>
          <Joinroom uuid={uuid} socket={socket} setUser={setUser}/>
        </div>

      </div>
    </div>
  );
}

export default Forms;
