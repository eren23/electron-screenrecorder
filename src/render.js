const { desktopCapturer, remote } = require("electron");
const { Menu, dialog } = remote;
const { writeFile, write } = require("fs");

const videoElement = document.querySelector("video");

const startBtn = document.getElementById("startBtn");

startBtn.onclick = (e) => {
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerText = "Recording";
};

const stopBtn = document.getElementById("stopBtn");

stopBtn.onclick = (e) => {
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerText = "Start";
};

const videoSelectBtn = document.getElementById("videoSelectBtn");

videoSelectBtn.onclick = getVideoSources;

//Grab available video sources
async function getVideoSources() {
  const availableInputs = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });

  const videoOptions = Menu.buildFromTemplate(
    availableInputs.map((input) => {
      return {
        label: input.name,
        click: () => selectSource(input),
      };
    })
  );
  videoOptions.popup();
}

let mediaRecorder; //To be able to capture footage
const recordsPieces = [];

//Change the video source
async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  };

  // Create a Stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();

  //Video recorder to be
  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);

  //Event handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
  console.log("data available");
  recordsPieces.push(e.data);
}

//Save everything on the stop
async function handleStop() {
  const blob = new Blob(recordsPieces, {
    type: "video/webm; codecs=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save Video",
    defaultPath: `vid-${Date.now()}.webm`,
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log("Saved Succesfully"));
  }
}
