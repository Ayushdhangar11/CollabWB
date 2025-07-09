import React from "react";
import { useNavigate } from "react-router";

function Joinroom({uuid,socket,setUser}) {

    const[roomId,setRoomId] = React.useState("")
    const[name,setName] = React.useState("")

    const navigate = useNavigate();

    const handleJoinRoom = (e) =>{
        e.preventDefault()
        const roomData = {
            name,
            roomid: roomId,
            host: false,
            userId: uuid(), 
            presenter: false,
          };
          console.log(roomData);
          setUser(roomData);
          socket.emit("userJoined", roomData);
          navigate(`/${roomId}`);
    }

  return (
    <div className="flex flex-col justify-center align-center w-full ">
      <form action="">
        <div className="flex m-5 justify-around align-center gap-5 mt-5 w-[90%">
          <label htmlFor="name" className="text-xl font-bold text-black-600 ">
            Name :{" "}
          </label>
          <input
            type="text"
            id="name"
            placeholder=" Enter your name"
            className="p-2 bg-gray-100 rounded-xl border-2 border-gray-400 w-3/4 h-10 "
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex m-5 justify-around align-center  gap-5 mt-5">
          <label htmlFor="id" className="text-xl font-bold text-black-600 ">
            Room ID:{" "}
          </label>
          <input
            type="text"
            id="id"
            placeholder=" Enter Room ID"
            className="p-2 bg-gray-100 rounded-xl border-2 border-gray-400 w-3/4 h-10 "
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
        </div>
        <div className="flex m-5 justify-center align-center mt-10">
          <button
            type="submit"
            className=" text-white font-bold text-xl rounded-3xl border-2 border-sky-600 w-1/2 h-10 bg-sky-500 hover:bg-sky-700 "
            onClick={handleJoinRoom}
          >
            Join
          </button>
        </div>
      </form>
    </div>
  );
}

export default Joinroom;
