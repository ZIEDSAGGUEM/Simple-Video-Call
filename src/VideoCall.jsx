import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { io } from "socket.io-client";

const socket = io("https://ed-5146638253031424.educative.run:3000");

function VideoCall() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");

  const userVideo = useRef(null);
  const connectionRef = useRef(null);
  const myVideo = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });

    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });
  }, []);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });

    peer.on("stream", (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });

    peer.on("stream", (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
  };

  return (
    <div>
      <div className="flex flex-row h-full w-full justify-center gap-[15%] h-screen z-">
        <div>
          <div className="flex-grow flex flex-col items-center justify-center h-[90%]">
            <span className="text-white font-bold text-3xl mb-4">Basic React JS video calling</span>
            <span className="text-white font-bold text-md mb-4 text-center underline">
              Copy your ID and anyone using the same server can use it to call you and vice versa!
            </span>
            <div className="flex flex-row gap-32">
              <div className="flex flex-col items-center justify-center w-full">
                <div className="video">
                  {stream && (
                    <video
                      className="rounded-full"
                      playsInline
                      muted
                      ref={myVideo}
                      autoPlay
                      style={{ width: "300px" }}
                    />
                  )}
                </div>
                <span className="text-white font-bold text-lg mb-4">{caller}</span>
                <p className="text-white">{me}</p>
              </div>

              <div className="flex flex-col items-center justify-center w-full">
                {callAccepted && !callEnded ? (
                  <video
                    className="rounded-full"
                    playsInline
                    ref={userVideo}
                    autoPlay
                    style={{ width: "300px" }}
                  />
                ) : (
                  <div className="flex flex-col justify-center items-center">
                    <img
                      src="https://w0.peakpx.com/wallpaper/416/423/HD-wallpaper-devil-boy-in-mask-red-hoodie-dark-background-4ef517.jpg"
                      className="rounded-full w-[15rem]"
                      alt="User Avatar"
                    />
                    <span className="text-white font-bold text-lg">{idToCall}</span>
                  </div>
                )}
              </div>
            </div>
            <textarea
              className="text-black"
              value={idToCall}
              onChange={(e) => {
                setIdToCall(e.target.value);
              }}
            />
                      <div>
              {callAccepted && !callEnded ? (
                <button className="text-black hover:text-gray-400 mr-6 font-bold bg-white rounded-md m-4 px-2" onClick={leaveCall}>
                  End Call
                </button>
              ) : (
                <button
                  className="text-black hover:text-gray-400 mr-6 font-bold bg-white rounded-md m-4 px-2"
                  onClick={() => callUser(idToCall)}
                >
                  Call
                </button>
              )}
            </div>
            <div className="text-white">
              {receivingCall && !callAccepted ? (
                <div className="caller flex flex-col">
                  <h1 className="text-white">{caller} is calling...</h1>
                  <button
                    className="text-black text-xl hover:text-gray-400 mr-6 font-bold bg-white rounded-md m-4 px-2"
                    onClick={answerCall}
                  >
                    Answer
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoCall;

