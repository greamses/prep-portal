/* The exam's eight spoken warnings: what each says, and the recording to play.
   Written by scripts/make-exam-warnings.mjs; the page only plays these files and never calls ElevenLabs. */
export const WARNINGS = {
  "no_face": {
    "text": "Please keep your face in view of the camera.",
    "url": "/tts-cache/bb4400c4e0ee5a6614ce573630e98eb4ea10a21c.mp3"
  },
  "extra_face": {
    "text": "Only you should be in view. Please ask anyone else to step away.",
    "url": "/tts-cache/d0ab1546ace6cf7c90ce86d128f5fc45b0180b3e.mp3"
  },
  "left_page": {
    "text": "You left the exam page. This is not allowed, and it has been recorded.",
    "url": "/tts-cache/dfbfb2fd745fb9d53bcf4120dde55cf05c66aa39.mp3"
  },
  "camera_off": {
    "text": "Your camera has stopped. Please turn it back on to continue.",
    "url": "/tts-cache/c08adba2a6ce769ebaa1eac9212f4e2086d5026b.mp3"
  },
  "leave_attempt": {
    "text": "Please do not leave or close the exam page. Finish your paper first.",
    "url": "/tts-cache/d10e91b3593ea0253c19efaa7e5bd8f298b64c09.mp3"
  },
  "second_warning": {
    "text": "This is your second warning. Leaving the exam page is not allowed.",
    "url": "/tts-cache/c6a54a372f4f79dc6b07b3d8add8a91fcba2e843.mp3"
  },
  "final_warning": {
    "text": "This is your final warning. Your teacher will be told.",
    "url": "/tts-cache/efc8af1e7bbb871beb3a31be326988f28284f238.mp3"
  },
  "time_low": {
    "text": "One minute left. Please finish your answers.",
    "url": "/tts-cache/f85885419d5beedac745a404248ecc36ffced04c.mp3"
  }
};
