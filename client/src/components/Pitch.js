import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactAudioPlayer from "react-audio-player";
import axios from "axios";
import LRC from "lrc.js";
import { useModel } from "react-tensorflow";
import * as tf from "@tensorflow/tfjs";

const lrc_string = ``;
const NUM_INPUT_SAMPLES = 1024;
const MODEL_SAMPLE_RATE = 16000;
const PT_OFFSET = 25.58;
const PT_SLOPE = 63.07;
const CONF_THRESHOLD = 0.9;

function getPitchHz(modelPitch) {
  const fmin = 10.0;
  const bins_per_octave = 12.0;
  const cqt_bin = modelPitch * PT_SLOPE + PT_OFFSET;
  return fmin * Math.pow(2.0, (1.0 * cqt_bin) / bins_per_octave);
}

export default function Pitch({ score, setScore }) {
  const { id } = useParams();
  const [currentSeconds, setSeconds] = useState(0);
  const [song, setSong] = useState("/audio/Never-Give-You-Up.mp3");
  const [pitches, setPitches] = useState([]);

  const handleSuccess = useCallback((stream, model) => {
    let context = new AudioContext({
      latencyHint: "playback",
      sampleRate: MODEL_SAMPLE_RATE,
    });

    let source = context.createMediaStreamSource(stream);
    let processor = context.createScriptProcessor(
      NUM_INPUT_SAMPLES,
      /*num_inp_channels=*/ 1,
      /*num_out_channels=*/ 1
    );

    // Converts audio to mono.
    processor.channelInterpretation = "speakers";
    processor.channelCount = 1;

    // Runs processor on audio source.
    source.connect(processor);
    processor.connect(context.destination);

    processor.onaudioprocess = function (e) {
      const inputData = e.inputBuffer.getChannelData(0);
      const input = tf.reshape(tf.tensor(inputData), [NUM_INPUT_SAMPLES]);
      const output = model.execute({ input_audio_samples: input });
      const uncertainties = output[0].dataSync();
      const pitches = output[1].dataSync();

      for (let i = 0; i < pitches.length; ++i) {
        let confidence = 1.0 - uncertainties[i];
        if (confidence < CONF_THRESHOLD) {
          continue;
        }
        const pitch = getPitchHz(pitches[i]);
        // console.log(pitch);
        setPitches((state) => [...state, pitch]);
      }
    };
  }, []);

  console.log(pitches);

  const onLoadCallback = useCallback(
    (model) => {
      if (model) {
        navigator.mediaDevices
          .getUserMedia({ audio: true, video: false })
          .then((data) => handleSuccess(data, model))
          .catch((err) => console.log(err));
      }
    },
    [handleSuccess]
  );

  useModel({
    modelUrl: `https://tfhub.dev/google/tfjs-model/spice/2/default/1`,
    onLoadCallback,
  });

  useEffect(() => {
    axios.get(`/api/songs/${id}`).then((res) => {
      setSong(res.data.originalAudio);
    });
  }, []);

  //Note:score temporarily displayed

  //console.log(song, currentSeconds, lrc)

  /*(Chanelle: calculating score)
  Given result pitches []:
  const originalPitchData = axios.get(`/api/pitchdatas/${id}`);
  const errorRates = originalPitchData.map((pitch, idx) => Math.abs(pitch - pitches[idx]) / pitch);
  const averageErrorRate = errorRates.reduce((accum, rate) => accum + rate, 0) / ; 
  const score = (1 - averageErrorRate / errorRates.length) * 100;
  */

  const onListen = (seconds) => {
    setSeconds(seconds);
  };

  return (
    <div className="singAlong">
      <br />
      <br />
      <br />
      <br />
      <br />

      <ReactAudioPlayer
        src={song}
        autoPlay
        controls
        muted
        listenInterval={3000}
        onListen={onListen}
      />
    </div>
  );
}
