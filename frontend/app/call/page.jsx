"use client";

import React, { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const ROOM_ID = "room-123";

const Call = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  // Create Peer Connection
  useEffect(() => {
    peerRef.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    console.log("Peer Created");

    // Send ICE Candidates
    peerRef.current.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          roomId: ROOM_ID,
          candidate: event.candidate,
        });
      }
    };

    // Receive Remote Stream
   peerRef.current.ontrack = (event) => {
  console.log("Remote Stream Received");
  console.log(event.streams);
  console.log(remoteVideoRef.current);

  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = event.streams[0];
  }
};

    return () => {
      peerRef.current?.close();
    };
  }, []);

  // Start Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        if (peerRef.current) {
          stream.getTracks().forEach((track) => {
            peerRef.current.addTrack(track, stream);
          });

          console.log("Tracks Added");
        }
      } catch (error) {
        console.log(error);
      }
    };

    startCamera();
  }, []);

  // Socket Connection
  useEffect(() => {
    socketRef.current = io("https://confrence-server.vercel.app");

    socketRef.current.on("connect", () => {
      console.log("Connected:", socketRef.current.id);

      socketRef.current.emit("join-room", ROOM_ID);
    });

    // Someone joined -> Create Offer
    socketRef.current.on("user-joined", async () => {
      try {
        console.log("Creating Offer");

        const offer = await peerRef.current.createOffer();

        await peerRef.current.setLocalDescription(offer);

        socketRef.current.emit("offer", {
          roomId: ROOM_ID,
          offer,
        });
      } catch (err) {
        console.log(err);
      }
    });

    // Receive Offer
    socketRef.current.on("offer", async (offer) => {
      try {
        console.log("Offer Received");

        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        const answer = await peerRef.current.createAnswer();

        await peerRef.current.setLocalDescription(answer);

        socketRef.current.emit("answer", {
          roomId: ROOM_ID,
          answer,
        });
      } catch (err) {
        console.log(err);
      }
    });

    // Receive Answer
    socketRef.current.on("answer", async (answer) => {
      try {
        console.log("Answer Received");

        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      } catch (err) {
        console.log(err);
      }
    });

    // Receive ICE Candidate
    socketRef.current.on("ice-candidate", async (candidate) => {
      try {
        await peerRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );

        console.log("ICE Added");
      } catch (err) {
        console.log(err);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        padding: "20px",
      }}
    >
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "400px",
          border: "2px solid green",
        }}
      />

      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{
          width: "400px",
          border: "2px solid red",
        }}
      />
    </div>
  );
};

export default Call;