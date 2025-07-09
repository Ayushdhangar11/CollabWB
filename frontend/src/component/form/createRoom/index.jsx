import React from "react";
import { FaRegCopy } from "react-icons/fa6";
import { TbCopyCheckFilled } from "react-icons/tb";
import { useNavigate } from "react-router-dom";

function Createroom({ uuid, socket, setUser }) {
  const [roomId, setRoomId] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [name, setName] = React.useState("");
  const navigate = useNavigate();

  const handleGenrateRoom = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    if (!roomId.trim()) {
      alert("Please generate a room ID");
      return;
    }

    const roomData = {
      name: name.trim(),
      roomid: roomId,
      host: true,
      userId: uuid(),
      presenter: true,
    };

    console.log("🚀 Creating room with data:", roomData);
    console.log("🔌 Socket connected:", socket.connected);
    console.log("🆔 Socket ID:", socket.id);

    // Set user data first
    setUser(roomData);
    
    // Emit to server
    socket.emit("userJoined", roomData);
    
    // Navigate to room
    navigate(`/${roomId}`);
  };

  // Generate room ID on component mount
  React.useEffect(() => {
    if (!roomId) {
      setRoomId(uuid());
    }
  }, [uuid, roomId]);

  return (
    <div className="flex flex-col justify-center align-center w-full">
      <form onSubmit={handleGenrateRoom}>
        <div className="flex m-5 justify-around align-center gap-5 mt-5 w-[90%]">
          <label htmlFor="name" className="text-xl font-bold text-black-600">
            Name:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Enter your name"
            className="p-2 bg-gray-100 rounded-xl border-2 border-gray-400 w-3/4 h-10"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="flex m-5 justify-around items-center font-bold gap-5 mt-5">
          <label htmlFor="id" className="text-xl font-bold text-black-600">
            Create ID:
          </label>

          <div className="relative w-3/4">
            <input
              type="text"
              disabled
              id="id"
              className="p-2 pr-32 bg-gray-100 rounded-xl border-2 border-gray-400 w-full h-10"
              value={roomId}
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                className="text-gray-600 hover:text-black"
                onClick={() => {
                  if (roomId) {
                    navigator.clipboard.writeText(roomId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
              >
                {copied ? <TbCopyCheckFilled /> : <FaRegCopy />}
              </button>

              <button
                type="button"
                className="bg-sky-500 hover:bg-sky-700 text-white px-3 py-1 rounded-md text-sm"
                onClick={() => setRoomId(uuid())}
              >
                Generate
              </button>
            </div>
          </div>
        </div>

        <div className="flex m-5 justify-center align-center mt-10">
          <button
            type="submit"
            className="text-white font-bold text-xl rounded-3xl border-2 border-sky-600 w-1/2 h-10 bg-sky-500 hover:bg-sky-700"
          >
            Create Room
          </button>
        </div>
      </form>
    </div>
  );
}

export default Createroom;