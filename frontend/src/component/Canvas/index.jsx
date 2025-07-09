import React, { useLayoutEffect, useEffect, useState } from "react";
import rough from "roughjs";

const roughGenerator = rough.generator();

function Whiteboard({
  canvasRef,
  ctxRef,
  elements,
  setElements,
  tool,
  color,
  socket,
}) {
  const [Drawing, setDrawing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ Setup Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight - 180;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;
  }, []);

  // ✅ Request initial elements when socket connects
  useEffect(() => {
    if (!socket) return;

    const roomId = window.location.pathname.slice(1);
    
    // Request existing elements when joining the room
    socket.emit("joinRoom", { roomId });
    
    console.log("🔌 Joined room:", roomId);
  }, [socket]);

  // ✅ Draw Elements
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const roughCanvas = rough.canvas(canvas);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach((element) => {
      const common = {
        stroke: element.stroke || "black",
        strokeWidth: element.strokeWidth || 2,
        roughness: 0.1,
      };

      if (element.type === "pencil") {
        roughCanvas.linearPath(element.path, common);
      } else if (element.type === "line") {
        roughCanvas.draw(roughGenerator.line(element.x1, element.y1, element.x2, element.y2, common));
      } else if (element.type === "rect") {
        const width = element.x2 - element.x1;
        const height = element.y2 - element.y1;
        roughCanvas.draw(roughGenerator.rectangle(element.x1, element.y1, width, height, common));
      } else if (element.type === "circle") {
        const centerX = (element.x1 + element.x2) / 2;
        const centerY = (element.y1 + element.y2) / 2;
        const radius = Math.sqrt(Math.pow(element.x2 - element.x1, 2) + Math.pow(element.y2 - element.y1, 2)) / 2;
        roughCanvas.draw(roughGenerator.circle(centerX, centerY, radius * 2, common));
      }
    });
  }, [elements]);
  

  // ✅ Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // Handle initial elements when joining a room
    socket.on("initialElements", (data) => {
      console.log("📥 Received initial elements:", data);
      setElements(data);
      setIsInitialized(true);
    });

    // Handle new drawings from other users
    socket.on("draw", (element) => {
      console.log("🎯 Received draw from other user:", element);
      setElements((prev) => [...prev, element]);
    });

    // Handle full canvas sync (backup method)
    socket.on("syncElements", (syncedElements) => {
      console.log("🔄 Synced full canvas:", syncedElements);
      setElements(syncedElements);
      setIsInitialized(true);
    });

    // Handle room joined confirmation
    socket.on("roomJoined", (data) => {
      console.log("✅ Room joined successfully:", data);
      if (data.elements && data.elements.length > 0) {
        setElements(data.elements);
        setIsInitialized(true);
      }
    });

    return () => {
      socket.off("draw");
      socket.off("initialElements");
      socket.off("syncElements");
      socket.off("roomJoined");
    };
  }, [socket]);

  // ✅ Handle Drawing Start
  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setDrawing(true);

    const base = {
      stroke: color,
      strokeWidth: 2,
    };

    if (tool === "pencil") {
      setElements((prev) => [
        ...prev,
        { type: "pencil", path: [[offsetX, offsetY]], ...base },
      ]);
    } else {
      const newShape = {
        x1: offsetX,
        y1: offsetY,
        x2: offsetX,
        y2: offsetY,
        type: tool,
        ...base,
      };
      setElements((prev) => [...prev, newShape]);
    }
  };

  // ✅ Handle Drawing in Progress
  const handleMouseMove = (e) => {
    if (!Drawing) return;
    const { offsetX, offsetY } = e.nativeEvent;

    setElements((prev) =>
      prev.map((el, index) => {
        if (index !== prev.length - 1) return el;

        if (el.type === "pencil") {
          return { ...el, path: [...el.path, [offsetX, offsetY]] };
        } else {
          return { ...el, x2: offsetX, y2: offsetY };
        }
      })
    );
  };

  // ✅ Handle Drawing Completion
  const handleMouseUp = () => {
    setDrawing(false);

    if (!socket || elements.length === 0) return;

    const lastElement = { ...elements[elements.length - 1] };
    const roomId = window.location.pathname.slice(1);

    socket.emit("draw", {
      roomid: roomId,
      element: lastElement,
    });

    console.log("📤 Emitted draw (on mouseUp):", lastElement);
  };

  return (
    <div
      className="w-full overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <canvas ref={canvasRef} className="w-full min-h-48 block" />
      {/* Optional: Show loading state while waiting for initial elements */}
      {!isInitialized && (
        <div className="absolute top-2 left-2 text-gray-500 text-sm">
          Loading canvas...
        </div>
      )}
    </div>
  );
}

export default Whiteboard;