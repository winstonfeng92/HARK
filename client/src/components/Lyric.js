import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useParams } from "react-router-dom";
import LRC from "lrc.js";
import axios from "axios";
import { Box } from "@mui/material";

const lrc_string = ``;

function Lyric({ songs, currentSeconds }) {
  const { id } = useParams();
  const song = songs.find((song) => song.id === id * 1);

  const [lrc, setLrc] = useState(() => {
    return LRC.parse(lrc_string);
  });

  useEffect(() => {
    axios.get(`/api/songs/${id}`).then((res) => {
      setLrc(() => {
        return LRC.parse(res.data.lyrics);
      });
    });
  }, []);

  const displayLyric = () => {
    const currentIndex =
      lrc.ti === "Since U Been Gone"
        ? lrc.lines.findIndex((item) => item.time >= currentSeconds - 4) - 1
        : lrc.lines.findIndex((item) => item.time >= currentSeconds) - 1;
    const futureLyric = lrc.lines[currentIndex === 0 ? 2 : currentIndex + 1];
    const prevLyric = lrc.lines[currentIndex === 0 ? 0 : currentIndex - 1];
    const lyric = lrc.lines[currentIndex === 0 ? 1 : currentIndex];
    return (
      <div>
        <Box
          sx={{
            display: "flex",
            textAlign: "center",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p className="inActive">{prevLyric?.text}</p>
          <div className="active">{lyric?.text}</div>
          <p className="inActive">{futureLyric?.text}</p>
        </Box>
      </div>
    );
  };

  return <div>{displayLyric()}</div>;
}

const mapState = ({ songs }) => ({ songs });

export default connect(mapState)(Lyric);
