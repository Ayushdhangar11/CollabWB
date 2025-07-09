import React, { useState, useEffect, useRef } from 'react';
import { IoSend, IoClose } from 'react-icons/io5';
import { FaComments } from 'react-icons/fa';

function ChatSidebar({ isOpen, onClose, socket, user, users }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Monitor socket connection
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => setConnectionStatus('connected');
    const handleDisconnect = () => setConnectionStatus('disconnected');
    const handleReconnect = () => setConnectionStatus('connected');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
    };
  }, [socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (messageData) => {
      console.log("📨 New message received:", messageData);
      
      // Prevent duplicate messages
      setMessages(prev => {
        const isDuplicate = prev.some(msg => 
          msg.id === messageData.id || 
          (msg.timestamp === messageData.timestamp && msg.senderId === messageData.senderId && msg.message === messageData.message)
        );
        
        if (isDuplicate) {
          console.log("⚠️ Duplicate message detected, ignoring");
          return prev;
        }
        
        return [...prev, messageData];
      });
      
      // Increment unread count if sidebar is closed and message is not from current user
      if (!isOpen && messageData.senderId !== (user?.userId || user?.id)) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleUserJoinedMessage = (message) => {
      const systemMessage = {
        id: `system-${Date.now()}-${Math.random()}`,
        type: 'system',
        message: message,
        timestamp: new Date().toISOString(),
        roomId: user?.roomid
      };
      
      setMessages(prev => [...prev, systemMessage]);
    };

    const handleUserLeftMessage = (message) => {
      const systemMessage = {
        id: `system-${Date.now()}-${Math.random()}`,
        type: 'system',
        message: message,
        timestamp: new Date().toISOString(),
        roomId: user?.roomid
      };
      
      setMessages(prev => [...prev, systemMessage]);
    };

    // Listen for chat messages
    socket.on("newMessage", handleNewMessage);
    socket.on("userJoinedNotification", handleUserJoinedMessage);
    socket.on("userLeftNotification", handleUserLeftMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userJoinedNotification", handleUserJoinedMessage);
      socket.off("userLeftNotification", handleUserLeftMessage);
    };
  }, [socket, user, isOpen]);

  // Clear unread count when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket || !user) return;

    // Check connection status
    if (connectionStatus !== 'connected') {
      console.warn("⚠️ Cannot send message: Socket not connected");
      return;
    }

    const messageData = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type: 'user',
      message: newMessage.trim(),
      sender: user.name,
      senderId: user.userId || user.id,
      timestamp: new Date().toISOString(),
      roomId: user.roomid
    };

    // Emit to server first
    socket.emit("sendMessage", messageData);
    
    // Clear input immediately
    setNewMessage('');
    
    console.log("📤 Message sent:", messageData);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => isOpen ? onClose() : onClose(false)}
        className={`fixed top-4 left-4 z-50 p-3 rounded-full shadow-lg transition-all duration-300 ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
      >
        {isOpen ? <IoClose size={24} /> : <FaComments size={24} />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold">Chat Room</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'
                }`}></span>
                <p className="text-sm opacity-90">
                  {users?.length || 0} {(users?.length || 0) === 1 ? 'user' : 'users'} online
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <IoClose size={20} />
            </button>
          </div>
        </div>

        {/* Connection Status */}
        {connectionStatus !== 'connected' && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3">
            <p className="text-sm font-medium">
              {connectionStatus === 'disconnected' ? 'Connection lost' : 'Reconnecting...'}
            </p>
          </div>
        )}

        {/* Online Users */}
        {users && users.length > 0 && (
          <div className="border-b border-gray-200 p-3">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Online Users</h3>
            <div className="flex flex-wrap gap-2">
              {users.map((u, index) => (
                <div
                  key={u.id || index}
                  className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {u.name === user?.name ? 'You' : u.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-200px)]">
          {Object.keys(groupedMessages).length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <FaComments size={48} className="mx-auto mb-4 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, dayMessages]) => (
              <div key={date} className="space-y-3">
                {/* Date separator */}
                <div className="text-center">
                  <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs">
                    {date}
                  </span>
                </div>
                
                {/* Messages for this date */}
                {dayMessages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    {msg.type === 'system' ? (
                      <div className="text-center">
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                          {msg.message}
                        </span>
                      </div>
                    ) : (
                      <div className={`flex ${msg.senderId === (user?.userId || user?.id) ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg break-words ${
                          msg.senderId === (user?.userId || user?.id)
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-gray-200 text-gray-800 rounded-bl-sm'
                        }`}>
                          {msg.senderId !== (user?.userId || user?.id) && (
                            <p className="text-xs font-semibold mb-1 opacity-75">
                              {msg.sender}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.senderId === (user?.userId || user?.id)
                              ? 'text-blue-100'
                              : 'text-gray-500'
                          }`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                connectionStatus === 'connected' 
                  ? "Type your message..." 
                  : "Connecting..."
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              maxLength={500}
              disabled={connectionStatus !== 'connected'}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || connectionStatus !== 'connected'}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
            >
              <IoSend size={20} />
            </button>
          </form>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              Press Enter to send
            </p>
            <p className="text-xs text-gray-500">
              {500 - newMessage.length} characters remaining
            </p>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onClose}
        />
      )}
    </>
  );
}

export default ChatSidebar;