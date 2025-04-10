import React, { useState, useEffect } from "react";
import Background from "../assets/Background.png";
import { X } from "lucide-react";
import socket from "../utils/Socket/Socket";
import clsx from "clsx";
import axiosInstance from "../utils/Axios/Axios";

const amongUsColors: Record<string, string> = {
    RubyGlow: "from-rose-500 via-red-500 to-orange-500 shadow-red-700", 
    SapphireWave: "from-blue-400 via-indigo-500 to-purple-500 shadow-indigo-700", 
    EmeraldFlash: "from-green-400 via-teal-500 to-cyan-500 shadow-teal-700", 
    GoldenSunrise: "from-yellow-400 via-amber-500 to-orange-600 shadow-amber-700", 
    AmethystDream: "from-purple-400 via-violet-500 to-fuchsia-500 shadow-violet-700",
    Sunset: "from-pink-500 via-orange-500 to-yellow-500 shadow-orange-700", 
    Ocean: "from-cyan-500 via-blue-500 to-indigo-600 shadow-blue-700", 
  };
  
  
  
  
  
  const amongUsOutfits: Record<string, string> = {
    None: "",
    Hat: "🎩",
    Helmet: "⛑️",
    Crown: "👑",
    Cap: "🧢",
    CowboyHat: "🤠",
    PirateHat: "🏴‍☠️",
    WitchHat: "🧙",
    PartyHat: "🥳",
    BunnyEars: "🐰",
    AlienAntenna: "👽",
    Sunglasses: "🕶️",
    RoundGlasses: "👓",
    Headphones: "🎧",
    NinjaMask: "🥷",
    ClownWig: "🤡",
    ChefHat: "👨‍🍳",
    VikingHelmet: "⚔️",
    AngelHalo: "😇",
    DevilHorns: "😈",
   
  };
  
  const randomName = [
    "Shadow", "Blaze", "Cosmo", "Lunar", "Bolt", "Nova", "Echo", "Rogue", 
    "Comet", "Phantom", "Turbo", "Storm", "Vortex", "Spark", "Astro"
  ];
  

  const randomNames = randomName;
  type Message = {
    _id: string | number;
    sender: string;
    message: string;
    chat: string;
    receiver: string;
  } | {
    _id: string | number;
    sender: "system";
    message: string;
  };
  
  
interface Player {
    id: string;
    name: string;
    x: number;
    y: number;
    color: string;
    outfit: string;
  }
  type Participant = {
    username: string;
    socketId: string;
    _id: string;
  };
  
  type Chat = {
    _id: string;
    participants: Participant[];
    createdAt: string;
    updatedAt: string;
  };
  
  
  interface ChatBoxProps {
    currentUsername: string | null;
    currentUser: string | null;
    refreshChatList: boolean; // 👈 Add this
  }
  interface MapProps {
    onNewChat: () => void;
  }
  

  const Map: React.FC<MapProps> = ({ onNewChat }) => {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [nearbyPlayer, setNearbyPlayer] = useState<Player | null>(null);
  const [customization, setCustomization] = useState({
    color: localStorage.getItem("playerColor") || "RubyGlow",
    outfit: localStorage.getItem("playerOutfit") || "None",
  });

  const [showCustomization, setShowCustomization] = useState(false);

  const handleCustomizationChange = (type: "color" | "outfit", value: string) => {
    setCustomization((prev) => ({ ...prev, [type]: value }));
    localStorage.setItem(`player${type.charAt(0).toUpperCase() + type.slice(1)}`, value);
  
    if (!myPlayer) return;
  
    const updatedPlayer = { ...myPlayer, [type]: value };
    setMyPlayer(updatedPlayer);
    setPlayers((prev) => ({ ...prev, [myPlayer.id]: updatedPlayer }));
    socket.emit("playerUpdated", updatedPlayer);
  };
  
  
  

useEffect(() => {
  if (!myPlayer) return;

  let closestPlayer: Player | null = null;
  let minDistance = Infinity;
  const proximityThreshold = 5; 

  Object.values(players).forEach((player) => {
    if (player.id !== myPlayer.id) {
      const distance = Math.sqrt(
        Math.pow(player.x - myPlayer.x, 2) + Math.pow(player.y - myPlayer.y, 2)
      );

      if (distance < minDistance && distance <= proximityThreshold) {
        closestPlayer = player;
        minDistance = distance;
      }
    }
  });

  setNearbyPlayer(closestPlayer);
}, [myPlayer, players]);

useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === "f" &&
        nearbyPlayer &&
        myPlayer 
      ) {
        try {
            const res = await axiosInstance.post(`/chat`, {
                user1: {
                  username: myPlayer.name,
                  socketId: socket.id
                },
                user2: {
                  username: nearbyPlayer.name,
                  socketId: nearbyPlayer.id
                }
              });
              
  
          console.log("Chat created:", res);
          onNewChat?.(); 
          socket.emit("chat created", {
            user1: myPlayer.id,
            user2: nearbyPlayer.id
          });
        } catch (err) {
          console.error("Chat creation error:", err);
        }
      }
    };
  
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [nearbyPlayer, myPlayer, onNewChat]); 
  
  
  


  const handleDoubleClick = (playerId: string, currentName: string) => {
    if (playerId === myPlayer?.id) { 
      setEditingPlayerId(playerId);
      setNewName(currentName);
    }
  };
  
  
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(event.target.value);
  };
  const handleBlurOrEnter = (playerId: string) => {
      console.log(playerId);
    if (editingPlayerId && newName.trim()) {
      const updatedPlayer = { 
        ...myPlayer!, 
        name: newName 
      }; 
  
      setMyPlayer(updatedPlayer);
      localStorage.setItem("playerName", newName);
      socket.emit("playerMoved", updatedPlayer);
    }
    setEditingPlayerId(null);
  };
  
  

  const handleToggleGame = () => {
    if (isGameStarted) {
      if (myPlayer) {
        socket.emit("playerLeft", myPlayer.id); 
      }
      setMyPlayer(null);
      setPlayers({});
    } else {
      handleStart();
    }
    setIsGameStarted(!isGameStarted);
  };
  
  

  useEffect(() => {
    socket.on("updatePlayers", (updatedPlayers: Record<string, Player>) => {
      setPlayers(updatedPlayers);
    });

    return () => {
      socket.off("updatePlayers");
    };
  }, []);

  const handleStart = () => {
    const savedName = localStorage.getItem("playerName");
    const savedColor = localStorage.getItem("playerColor");
    const savedOutfit = localStorage.getItem("playerOutfit");
  
    const randomName = savedName || randomNames[Math.floor(Math.random() * randomNames.length)];
    const randomColor = savedColor || "RubyGlow"; 
    const randomOutfit = savedOutfit || "None";
  
    const newPlayer: Player = {
      id: socket.id!,
      name: randomName,
      x: Math.floor(Math.random() * 90) + 5,
      y: Math.floor(Math.random() * 90) + 5,
      color: randomColor, 
      outfit: randomOutfit,
    };
  
    setMyPlayer(newPlayer);
    localStorage.setItem("playerName", randomName);
    localStorage.setItem("playerColor", randomColor);
    localStorage.setItem("playerOutfit", randomOutfit);
    socket.emit("playerJoined", newPlayer);
  };
  
  
  

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!myPlayer) return;

      let newX = myPlayer.x;
      let newY = myPlayer.y;

      if (event.key === "ArrowLeft") newX = Math.max(myPlayer.x - 1, 0);
      if (event.key === "ArrowRight") newX = Math.min(myPlayer.x + 1, 99);
      if (event.key === "ArrowUp") newY = Math.max(myPlayer.y - 1, 0);
      if (event.key === "ArrowDown") newY = Math.min(myPlayer.y + 1, 99);

      if (newX !== myPlayer.x || newY !== myPlayer.y) {
        const updatedPlayer = { ...myPlayer, x: newX, y: newY };
        setMyPlayer(updatedPlayer);
        socket.emit("playerMoved", updatedPlayer);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [myPlayer]);

  return (
    <div className="relative w-[65%] h-screen bg-cover bg-center" style={{ backgroundImage: `url(${Background})`, width: "1380px" }}>
      <button
        className="absolute top-5 left-5 flex items-center gap-2 bg-blue-500 hover:bg-red-500 text-white px-4 py-2 rounded"
        onClick={handleToggleGame}
        >
        {isGameStarted ? (
            <>
            Quit <X className="w-4 h-4" /> 
            </>
        ) : (
            "Start"
        )}
        </button>
        {nearbyPlayer && (
      <div
        className="absolute top-10 left-1/2 transform -translate-x-1/2 
          bg-black text-white text-sm px-3 py-2 rounded-md opacity-90"
      >
        Press <span className="font-bold">F</span> to start conversation with {nearbyPlayer.name}
      </div>
    )}

<div>
    <button onClick={() => setShowCustomization(!showCustomization)} className="absolute top-5 right-5 bg-gray-700 text-white px-4 py-2 rounded">
      Customize
    </button>

    {showCustomization && (
      <div className="absolute top-16 right-5 bg-white p-4 shadow-md rounded-md">
        <h3 className="font-bold">Customize Your Character</h3>
        
        
        <div className="grid grid-cols-4 gap-2">
  {Object.keys(amongUsColors).map((color) => {
    console.log(color, amongUsColors[color]);

    return (
      <button
        key={color}
        className={clsx(
          "w-10 h-10 rounded-full border-2 transition-all duration-200",
          `bg-gradient-to-b ${amongUsColors[color]}`, 
          customization.color === color
            ? "border-black scale-110 shadow-lg"
            : "border-gray-300"
        )}
        onClick={() => handleCustomizationChange("color", color)}
        aria-label={color}
      />
    );
  })}
</div>

        <div>
          <p>Outfit:</p>
          <select
            value={customization.outfit}
            onChange={(e) => handleCustomizationChange("outfit", e.target.value)}
            className="border p-1 rounded"
          >
            {Object.keys(amongUsOutfits).map((outfit) => (
              <option key={outfit} value={outfit}>{outfit}</option>
            ))}
          </select>
        </div>
      </div>
    )}
  </div>

      {Object.values(players).map((player) => (
       <div
        key={player.id}
        className="absolute flex flex-col items-center"
        style={{ top: `${player.y}%`, left: `${player.x}%`, transform: "translate(-50%, -50%)" }}
        onDoubleClick={() => handleDoubleClick(player.id, player.name)}
        >
         <div className={`relative flex flex-col items-center w-[20px] h-[30px] 
            bg-gradient-to-b ${amongUsColors[player.color]} 
            rounded-[10px] shadow-lg border-[1px] border-black`}
        >
        {player.outfit !== "None" && (
            <div className="absolute -top-4 text-lg">
            {amongUsOutfits[player.outfit]}
            </div>
        )}

                <div className={`absolute -left-[6px] top-[4px] w-[8px] h-[14px] 
                    bg-gradient-to-b ${amongUsColors[player.color]} 
                    rounded-md shadow-md border-[1px] border-black opacity-80`}
                ></div>

            <div
              className="absolute top-[3px] left-[4px] w-[10px] h-[6px] 
                bg-gradient-to-r from-gray-200 to-blue-300 rounded-full 
                border-[1px] border-gray-700 shadow-md"
            >
              <div className="absolute top-[1px] left-[3px] w-[3px] h-[2px] bg-white rounded-full opacity-75"></div>
            </div>

            <div className={`absolute bottom-[-4px] left-[2px] w-[6px] h-[8px] 
                bg-gradient-to-b ${amongUsColors[player.color]}
                rounded-md shadow-inner border-[1px] border-black`}
            ></div>

            <div className={`absolute bottom-[-4px] right-[2px] w-[6px] h-[8px] 
                bg-gradient-to-b ${amongUsColors[player.color]}
                rounded-md shadow-inner border-[1px] border-black`}
            ></div>
          </div>

          {editingPlayerId === player.id ? (
                <input
                type="text"
                className="mt-0.5 text-black text-[8px] bg-white px-1 rounded outline-none border border-gray-400"
                value={newName}
                onChange={handleNameChange}
                onBlur={() => handleBlurOrEnter(player.id)}
                onKeyDown={(e) => e.key === "Enter" && handleBlurOrEnter(player.id)}
                autoFocus
                />
            ) : (
                <div className="mt-0.5 text-white text-[8px] bg-black bg-opacity-50 px-1 rounded">
                {player.name}
                </div>
            )}
        </div>
      ))}
    </div>
  );
};

const ChatBox: React.FC<ChatBoxProps> = ({ currentUsername,refreshChatList,currentUser }) => {
    const [chatList, setChatList] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [otherUser, setOtherUser] = useState<string | null>(null);
    const [opponentSocketId, setOpponentSocketId] = useState<string | null>(null);

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [expandedChatId, setExpandedChatId] = useState<string | null>(null);
    const [isChatEnded, setIsChatEnded] = useState(false);
  

    useEffect(() => {
        if (selectedChat?._id) {
          fetchMessages();
        }
      }, [selectedChat]);
      
      const fetchMessages = async () => {
        if (!selectedChat) return;
    
        try {
            const { data } = await axiosInstance.get(
                `/getmessage/${selectedChat._id}`
            );
            console.log("Fetched messages:", data.messages);
    
            setMessages(data.messages || []);
    
            socket.emit("join chat", selectedChat._id);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };
    
    useEffect(() => {
        if (currentUsername) fetchChats();
      }, [currentUsername, refreshChatList]);

      const fetchChats = async () => {
        try {
          const res = await axiosInstance.get(`/chatList/${currentUsername}`);
          console.log("Fetched",res.data.chats);
          
          if (res.data.success) {
            setChatList([...res.data.chats]);
          }
        } catch (error) {
          console.error("Error fetching chat list", error);
        }
      };
      
            
    
 
  
    const handleChatClick = (chat: Chat) => {
        const other = chat.participants.find(p => p.socketId !== currentUsername);        
        console.log("chatttttttttt",other);
        
        setSelectedChat(chat);
        setOtherUser(other?.username || null);
        setOpponentSocketId(other?.socketId || null );
        console.log("opponent socket",opponentSocketId);
        
        
      
        if (socket && chat._id) {
          socket.emit("join chat", chat._id); 
        }
      };
      useEffect(() => {
        const handleChatListUpdate = (data: any) => {
          console.log("chat list update received", data);
      
          const involvesCurrentUser = 
            data.user1 === currentUsername || data.user2 === currentUsername;
      
          if (involvesCurrentUser) {
            fetchChats();
      
            if (
              selectedChat &&
              selectedChat.participants.some(p => 
                [data.user1, data.user2].includes(p.socketId)
              )
            ) {
              setSelectedChat(null);
              setOtherUser(null);
              setMessages([]);
            }
          }
        };
      
        socket.on("chat list update", handleChatListUpdate);
      
        return () => {
          socket.off("chat list update", handleChatListUpdate);
        };
      }, [selectedChat, currentUsername]);
      

      
      
      useEffect(() => {
        socket.on("opponentLeft", (data) => {
            setOpponentLeft(true);
          setMessages((prev) => [
            ...prev,
            {
              _id: Date.now(),
              sender: "system",
              message: data.message,
              receiver: "", 
              chat: "",  
            } as Message,
          ]);
        });
      
        return () => {
          socket.off("opponentLeft");
        };
      }, []);
      
      useEffect(() => {
        setOpponentLeft(false);
      }, [selectedChat, otherUser]);
      
      
      
          useEffect(() => {
        socket.on('message received', (newMessage) => {
            console.log("Message received:", newMessage);
    
            if (newMessage.chat !== selectedChat?._id) {
                console.log("New message for another chat");
                return;
            }
    
            if (!messages.some(msg => msg._id === newMessage._id)) {
                setMessages((prevMessages) => [...prevMessages, newMessage]);
            }
        });
    
        return () => {
            socket.off('message received');
        };
    }, [socket, selectedChat?._id, messages]);
  
      const handleSendMessage = async () => {
        if (!message.trim() || !selectedChat) return;
      
        try {
          const response = await axiosInstance.post("/sendmessage", {
            chatId: selectedChat._id,
            socketId: currentUsername,
            message: message
          });
      console.log("TESDA",response)
      socket.emit("new message", response.data);
          setMessage("");
          fetchMessages(); 
          return response.data; 

        } catch (err) {
          console.error("Error sending message", err);
        }
      };
      
      const handleEndChat = (chatId: string, opponentPlayerId: string) => {
        socket.emit("end chat", { chatId, opponentPlayerId });
      
        setChatList(prev => prev.filter(chat => chat._id !== chatId));
        setIsChatEnded(true);
      };
      
      
      
      
      
     
      useEffect(() => {
        socket.on("chat ended", (data) => {
          console.log("Chat ended received:", data);
      
          setOpponentLeft(true); 
      
          setMessages((prev) => [
            ...prev,
            {
              _id: Date.now(), 
              sender: "system",
              message: data.message,
              receiver: "", 
              chat: data.chatId,
            } as Message,
          ]);
        });
      
        return () => {
          socket.off("chat ended");
        };
      }, []);
      
      
    return (
        <div className="w-[35%] h-screen bg-gray-900 text-white flex flex-col border-l border-gray-700">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedChat(null);
              setOtherUser(null);
            }}
            className="text-white text-xl mr-2 hover:text-gray-400"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold flex-1 text-center" style={{width:"10px"}}>
            {selectedChat ? otherUser : "Chat Box"}
          </h2>
          <div className="w-6" />
        </div>
      
        {selectedChat && otherUser ? (
          <div className="flex flex-col flex-1 overflow-hidden">
 <div
  onDoubleClick={() =>
    setExpandedChatId(prev => (prev === selectedChat._id ? null : selectedChat._id))
  }
  className="flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-700 bg-gray-800 shrink-0"
>
<div className="relative group flex items-center gap-4 overflow-hidden">
  <img
    src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${otherUser}`}
    className="w-10 h-10 rounded-full shrink-0"
    alt={otherUser}
  />
  <div className="min-w-0">
    <div className="font-medium truncate max-w-[180px] sm:max-w-[250px]">
      {otherUser}
    </div>
    <div className="text-sm text-gray-400 truncate">Online</div>
  </div>
</div>
 


  <div
      className={`transition-all duration-300 overflow-hidden ${
        expandedChatId === selectedChat._id ? 'max-w-[100px]' : 'max-w-0'
      }`}
    >
      {!isChatEnded && opponentSocketId && (
        <button
            onClick={() => handleEndChat(selectedChat._id, opponentSocketId)}
            className="ml-2 text-sm px-2 py-1 text-red-500 border border-red-500 rounded hover:bg-red-500 hover:text-white transition whitespace-nowrap"
        >
            End Chat
        </button>
        )}

    </div>
</div>


      
            <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No messages yet...</p>
            ) : (
                messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`mb-2 ${
                        msg.sender === "system"
                          ? "text-center text-gray-400 italic"
                          : msg.sender === currentUsername
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {msg.sender === "system" ? (
                        <span>{msg.message}</span>
                      ) : (
                        <div className="inline-block px-3 py-2 bg-gray-700 rounded-lg text-sm text-white">
                          <span>{msg.message}</span>
                        </div>
                      )}
                    </div>
                  ))
                  
            )}
            </div>


      
          
            <div className="w-full p-4 border-t border-gray-700 bg-gray-800 flex gap-2 shrink-0">
                <input
                type="text"
                className="w-[70%] px-2 py-1 rounded bg-gray-700 text-white text-sm outline-none"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={opponentLeft}
                />
                <button
                onClick={handleSendMessage}
                className="w-[30%] bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                disabled={opponentLeft}
                >
                Send
                </button>
            </div>




          </div>
        ) : chatList.length === 0 ? (
          <div className="p-4 text-gray-400">No chats found</div>
        ) : (
            
            chatList.map((chat) => {
                const other = chat.participants.find((p) => p.username !== currentUser);

              
                if (!other) return null;
              
                return (
                  <div
                    key={chat._id}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800 hover:bg-gray-700 overflow-hidden"
                  >
                    <div
                      onClick={() => handleChatClick(chat)}
                      className="flex items-center gap-4 cursor-pointer"
                    >
                      <div className="relative w-10 h-10">
                        <img
                          src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${other.username}`}
                          alt={other.username}
                          className="w-10 h-10 rounded-full border border-gray-700"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></span>
                      </div>
                      <div>
                        <div className="font-medium">{other.username}</div>
                        <div className="text-sm text-gray-400">Last seen recently</div>
                      </div>
                    </div>
                  </div>
                );
              })
        )}
      </div>
    );
  };
  

const GameWithChat: React.FC = () => {
    const currentUser = localStorage.getItem("playerName");
    const [refreshChatList, setRefreshChatList] = useState(false);
    const [currentUsername, setCurrentUserId] = useState<string | null>(null);
    useEffect(() => {
        const handleConnect = () => {
          setCurrentUserId(socket.id ?? null); 
        };
    
        if (socket.connected && socket.id) {
          setCurrentUserId(socket.id);
        } else {
          socket.on("connect", handleConnect);
        }
    
        return () => {
          socket.off("connect", handleConnect);
        };
      }, []);

  return (
    <div className="flex h-screen">
       <Map 
        onNewChat={() => setRefreshChatList(prev => !prev)} 
      />
       <ChatBox 
        currentUsername={currentUsername} 
        refreshChatList={refreshChatList}
        currentUser={currentUser}
      />    </div>
  );
};

export default GameWithChat;

