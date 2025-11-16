const socket = io(); // Connect to Socket.IO server
let localStream;
let peerConnection;
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const roomInput = document.getElementById("roomInput");
const startBtn = document.getElementById("startBtn");

let roomId;

// Start / Join Call
startBtn.onclick = async () => {
    roomId = roomInput.value || Math.floor(1000 + Math.random() * 9000).toString();
    roomInput.value = roomId;
    await initCall();
    socket.emit("join-room", roomId);
};

// Initialize WebRTC Call
async function initCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(config);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = e => {
        remoteVideo.srcObject = e.streams[0];
    };

    peerConnection.onicecandidate = e => {
        if (e.candidate) {
            socket.emit("ice-candidate", { candidate: e.candidate, roomId });
        }
    };
}

// Socket.IO Events
socket.on("user-connected", async (id) => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", { offer, roomId });
});

socket.on("offer", async (data) => {
    await peerConnection.setRemoteDescription(data.offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", { answer, roomId });
});

socket.on("answer", async (data) => {
    await peerConnection.setRemoteDescription(data.answer);
});

socket.on("ice-candidate", async (data) => {
    try {
        await peerConnection.addIceCandidate(data.candidate);
    } catch (err) {
        console.error(err);
    }
});

socket.on("user-disconnected", () => {
    remoteVideo.srcObject = null;
});
